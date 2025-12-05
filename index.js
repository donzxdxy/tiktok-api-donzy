const express = require("express");
const cheerio = require("cheerio");
const axios = require("axios");
const app = express();

/* ============  TIKTOK V1 (ttsave.app)  ============ */

const headers = {
    "authority": "ttsave.app",
    "accept": "application/json, text/plain, */*",
    "origin": "https://ttsave.app",
    "referer": "https://ttsave.app/en",
    "user-agent": "Postify/1.0.0",
};

const tiktokdl = {
    submit: async function(url, referer) {
        const headerx = { ...headers, referer };
        const data = { query: url, language_id: "1" };
        return axios.post("https://ttsave.app/download", data, { headers: headerx });
    },

    parse: function($) {
        const description = $("p.text-gray-600").text().trim();
        const dlink = {
            nowm: $("a.w-full.text-white.font-bold").first().attr("href"),
            audio: $('a[type="audio"]').attr("href"),
        };

        const slides = $('a[type="slide"]').map((i, el) => ({
            number: i + 1,
            url: $(el).attr("href"),
        })).get();

        return { description, dlink, slides };
    },

    fetchData: async function(link) {
        const response = await this.submit(link, "https://ttsave.app/en");
        const $ = cheerio.load(response.data);
        const result = this.parse($);
        return {
            video_nowm: result.dlink.nowm,
            audio_url: result.dlink.audio,
            slides: result.slides,
            description: result.description,
        };
    }
}

/* ============  TIKTOK V2 (tikwm API)  ============ */

async function tiktokV2(query) {
    const encodedParams = new URLSearchParams();
    encodedParams.set("url", query);
    encodedParams.set("hd", "1");

    const response = await axios({
        method: "POST",
        url: "https://tikwm.com/api/",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            Cookie: "current_language=en",
        },
        data: encodedParams,
    });

    return response.data;
}

/* ============  API ENDPOINT  ============ */

app.get("/api/tiktok", async (req, res) => {
    const { url } = req.query;

    if (!url) return res.status(400).json({
        status: false,
        message: "Masukkan parameter ?url="
    });

    try {
        const v1 = await tiktokdl.fetchData(url);
        const v2 = await tiktokV2(url);

        res.json({
            status: true,
            creator: "DonzyTzy",
            result: {
                ttsave: v1,
                tikwm: v2
            }
        });

    } catch (err) {
        res.status(500).json({
            status: false,
            error: err.message
        });
    }
});

/* ============  RUN LOCALHOST  ============ */

app.listen(3000, () => {
    console.log("Server berjalan di http://localhost:3000");
});


