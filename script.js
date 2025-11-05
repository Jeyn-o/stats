const fs = require('fs');
const https = require('https');

const API_KEY = 'xdebhV4kVsmzMj8X';
const CONTRIBUTORS_URL = `https://api.torn.com/v2/faction/contributors?stat=gymtrains&cat=current&key=${API_KEY}`;
const USER_URL_BASE = `https://api.torn.com/v2/user/`;

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (err) {
          reject(`Failed to parse JSON: ${err}`);
        }
      });
    }).on('error', reject);
  });
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  try {
    console.log('Fetching contributors...');
    const contributorsResponse = await fetchJson(CONTRIBUTORS_URL);
    const contributors = contributorsResponse.contributors;

    // ✅ Create reduced JSON: { id: { name, value } }
    const reduced = {};
    for (const { id, username, value } of contributors) {
      reduced[id] = { name: username, value };
    }

    fs.writeFileSync('challenge.json', JSON.stringify(reduced, null, 2));
    console.log('Saved reduced contributors to challenge.json');

    // -- Optional: full stat fetcher is currently disabled --
    if (!true) { // switch this to `if (true)` to enable full stat fetching
      const results = [];

      for (let i = 0; i < contributors.length; i++) {
        const { id, username } = contributors[i];
        const userUrl = `${USER_URL_BASE}${id}/personalstats?stat=totalstats&key=${API_KEY}`;

        console.log(`Fetching comp value for ${username} (ID: ${id})...`);
        try {
          const userStats = await fetchJson(userUrl);
          const skill = userStats?.personalstats?.[0]?.value ?? 'N/A';
          const entry = `${id} - ${username} : ${skill}`;
          results.push(entry);
          console.log(i, ':', entry);
        } catch (err) {
          console.error(`Error fetching stats for ${username} (ID: ${id}): ${err}`);
          results.push(`${id} - ${username} : ERROR`);
        }

        if (i < contributors.length - 1) {
          await delay(2000); // 2 seconds between requests
        }
      }

      fs.writeFileSync('stats.txt', results.join('\n'));
      console.log('Saved all stats to stats.txt');
    }

  } catch (error) {
    console.error('Fatal error:', error);
  }
}

main();
