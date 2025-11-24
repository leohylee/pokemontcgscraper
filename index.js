#!/usr/bin/env node
"use strict";

//Constants
const SCRAPE_URL = "https://www.pokemon.com/us/pokemon-tcg/pokemon-cards/";

//Requires
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const cheerio = require('cheerio');
const trim = require('trim');
const Url = require('url');
const qs = require('querystring');
const capitalize = require('capitalize');
const _ = require('lodash');

// Use stealth plugin to avoid bot detection
puppeteer.use(StealthPlugin());

let browser = null;

async function getBrowser() {
    if (!browser) {
        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu',
                '--disable-blink-features=AutomationControlled',
                '--window-size=1920,1080'
            ]
        });
    }
    return browser;
}

async function closeBrowser() {
    if (browser) {
        await browser.close();
        browser = null;
    }
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function makeUrl(url, query) {
    return url + "?" + qs.stringify(query);
}

function cardIdFromUrl(url) {
    const match = url.match(new RegExp("/(\\w+/\\w+)/$"));
    return match ? match[1] : null;
}

async function fetchPageWithPuppeteer(url) {
    const browser = await getBrowser();
    const page = await browser.newPage();

    try {
        // Set a realistic viewport
        await page.setViewport({ width: 1920, height: 1080 });

        // Set extra HTTP headers
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'en-US,en;q=0.9',
        });

        // Navigate to the page
        console.log(`Loading: ${url}`);
        await page.goto(url, {
            waitUntil: 'networkidle0',
            timeout: 60000
        });

        // Wait longer for any bot detection challenges to complete
        await delay(8000);

        // Check if we're on a bot detection page
        const title = await page.title();
        const content = await page.content();

        if (title.includes('Pardon') || content.includes('Pardon Our Interruption')) {
            console.log('Bot detection page detected, waiting longer...');
            await delay(10000); // Wait for challenge to potentially complete

            // Get content again
            const newContent = await page.content();
            return newContent;
        }

        // Get the HTML content
        const html = await page.content();

        return html;
    } finally {
        await page.close();
    }
}

async function scrapeSearchPage(pageUrl) {
    try {
        const html = await fetchPageWithPuppeteer(pageUrl);

        // Check if we got blocked
        if (html.includes('Pardon Our Interruption') || html.length < 10000) {
            throw new Error('Bot detection triggered despite using browser.');
        }

        const $ = cheerio.load(html);

        // Try multiple selectors for card results
        let cardElements = $('#cardResults li');
        if (cardElements.length === 0) {
            cardElements = $('.card-item');
        }
        if (cardElements.length === 0) {
            cardElements = $('[data-card-id]');
        }
        if (cardElements.length === 0) {
            cardElements = $('.card, .pokemon-card, .tcg-card');
        }

        console.log(`Found ${cardElements.length} card elements`);

        const cards = Array.from(cardElements).map(el => {
            const $card = $(el);

            // Try to find the card URL
            const $link = $card.find("a").first();
            const href = $link.attr("href");
            if (!href) return null;

            const url = Url.resolve(SCRAPE_URL, href);

            // Try to find the image
            const $img = $card.find("img").first();
            const imgSrc = $img.attr("src") || $img.attr("data-src") || $img.attr("data-lazy-src");

            return {
                url: url,
                image: imgSrc ? Url.resolve(SCRAPE_URL, imgSrc) : null,
                id: cardIdFromUrl(url)
            };
        }).filter(card => card !== null);

        // Work out how many pages in total there are
        let numPages = 1;
        let totalText = $('#cards-load-more>div>span').text();

        if (!totalText) {
            totalText = $('.pagination, [class*="pagination"], [class*="page-info"]').text();
        }

        if (totalText) {
            const match = /(\d+)\s+of\s+(\d+)/i.exec(totalText) || /page\s+\d+\s+of\s+(\d+)/i.exec(totalText);
            if (match) {
                numPages = parseInt(match[match.length - 1]);
            }
        }

        if (cards.length > 0 && numPages === 1) {
            console.log('Could not determine total pages, assuming single page');
        }

        return {
            numPages: numPages,
            cards: cards
        };

    } catch (error) {
        throw error;
    }
}

function scrapeEnergies(el, $, func) {
    const $el = $(el);

    $el.find("li").each(function (i, val) {
        const $val = $(val);
        const type = $val.attr("title");
        if (type) {
            func(type, $val);
        }
    });
}

function formatText(str) {
    if (!str) return '';
    return trim(str.replace(/\r?\n|\r/g, " "));
}

async function scrapeCard(url) {
    try {
        const html = await fetchPageWithPuppeteer(url);

        // Check if we got blocked
        if (html.includes('Pardon Our Interruption') || html.length < 5000) {
            throw new Error('Bot detection triggered despite using browser.');
        }

        const card = {};
        const $ = cheerio.load(html);
        const $stats = $(".pokemon-stats");

        card.id = cardIdFromUrl(url);

        const $header = $(".card-description");
        card.name = $header.find("h1").text();

        const $basicInfo = $(".card-basic-info");

        const $img = $(".card-image>img");
        const imgSrc = $img.attr('src') || $img.attr('data-src');
        if (imgSrc) {
            card.image = Url.resolve(url, imgSrc);
        }

        const $type = $basicInfo.find(".card-type");
        card.type = $type.find("h2").text();
        if (card.type.indexOf("Trainer") != -1)
            card.superType = "Trainer";
        else if (card.type.indexOf("Energy") != -1)
            card.superType = "Energy";
        else if (card.type.indexOf("Pokémon") != -1)
            card.superType = "Pokémon";

        card.set = {
            name: formatText($stats.find("h3").text()),
            url: Url.resolve(SCRAPE_URL, $stats.find("h3 > a").attr("href") || '')
        };

        if (card.superType == "Trainer" || card.superType == "Energy") {
            card.text = formatText($(".pokemon-abilities").text());
            return card;
        }

        const $evolved_from = $type.find("h4");
        if ($evolved_from.length > 0)
            card.evolvesFrom = trim($evolved_from.find("a").text());

        const hp_text = $basicInfo.find(".card-hp").text();
        const hpMatch = /\d+/.exec(hp_text);
        card.hp = hpMatch ? parseInt(hpMatch[0]) : 0;

        const passive_name = $(".pokemon-abilities h3");
        if (passive_name.length > 0 && passive_name.next()[0] && passive_name.next()[0].name == "p") {
            card.passive = {
                name: passive_name.find("div:last-child").text(),
                text: formatText(passive_name.next().text())
            };
        }

        card.abilities = [];
        card.rules = [];
        const $abilities = $(".pokemon-abilities .ability");
        $abilities.each(function (i, el) {
            const $ability = $(el);
            const ability = {
                cost: []
            };

            const $name = $ability.find("h4.left");
            if ($name.length == 0) {
                card.rules.push(formatText($ability.text()));
                return;
            }
            ability.name = $name.text();

            const $energies = $ability.find("ul.left li");
            $energies.each(function (i, energy) {
                const $energy = $(energy);
                const type = $energy.attr("title");
                if (type) {
                    ability.cost.push(type);
                }
            });

            const $damage = $ability.find("span.right.plus");
            ability.damage = $damage.text();

            const $text = $ability.find(">p");
            ability.text = formatText($text.text());

            card.abilities.push(ability);
        });

        const colourUrl = $basicInfo.find(".right>a").attr("href");
        if (colourUrl) {
            const parsed = Url.parse(colourUrl, true);
            const queryString = Object.keys(parsed.query)[0];
            if (queryString) {
                const match = /card-(.*)/.exec(queryString);
                if (match) {
                    card.color = capitalize(match[1]);
                }
            }
        }
        if (!card.color) {
            const pairs = _.chain(card.abilities)
                .map("cost")
                .flatten()
                .countBy(function (energy) {
                    return energy;
                }).pairs()
                .value();

            if (pairs.length > 0) {
                card.color = _.chain(pairs)
                    .max(function (pair) {
                        return pair[1];
                    })
                    .value()[0];
            }
        }

        card.weaknesses = [];
        const $weakness = $stats.find(".stat:contains(Weakness)");
        scrapeEnergies($weakness.find("ul.card-energies"), $, function (type, $el) {
            card.weaknesses.push({
                type: type,
                value: trim($el.text())
            });
        });

        card.resistances = [];
        const $resistance = $stats.find(".stat:contains(Resistance)");
        scrapeEnergies($resistance.find("ul.card-energies"), $, function (type, $el) {
            card.resistances.push({
                type: type,
                value: trim($el.text())
            });
        });

        const $retreat = $stats.find(":contains(Retreat Cost)");
        card.retreatCost = $retreat.find(".energy").length;

        return card;
    } catch (error) {
        throw error;
    }
}

async function scrapeAll(query, scrapeDetails = true) {
    try {
        console.log('Starting scrape with query:', query);

        const scrapeURL = makeUrl(SCRAPE_URL, query);
        console.log('Fetching:', scrapeURL);

        const search = await scrapeSearchPage(scrapeURL);
        console.log(`Found ${search.cards.length} cards on first page, ${search.numPages} total pages`);

        let cards = search.cards;

        for (let i = 2; i <= search.numPages; i++) {
            console.log(`Scraping page ${i} of ${search.numPages}...`);
            const pageURL = makeUrl(Url.resolve(SCRAPE_URL, i.toString()), query);
            const results = await scrapeSearchPage(pageURL);
            cards = cards.concat(results.cards);

            // Add delay between pages to avoid bot detection (2-4 seconds random)
            const pageDelay = 2000 + Math.random() * 2000;
            await delay(pageDelay);
        }

        console.log(`Total cards found: ${cards.length}`);

        if (scrapeDetails) {
            console.log('Scraping details for each card...');
            for (let i = 0; i < cards.length; i++) {
                console.log(`Scraping card ${i + 1} of ${cards.length}: ${cards[i].url}`);
                try {
                    const details = await scrapeCard(cards[i].url);
                    Object.assign(cards[i], details);
                } catch (err) {
                    console.error(`Failed to scrape card ${i + 1}: ${err.message}`);
                }
            }
        }

        return cards;
    } catch (error) {
        console.error('Error in scrapeAll:', error.message);
        throw error;
    }
}

module.exports = {
    scrapeAll: scrapeAll,
    scrapeCard: scrapeCard,
    scrapeSearchPage: scrapeSearchPage,
    closeBrowser: closeBrowser
};
