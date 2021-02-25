const Discord = require('discord.js');
const randomcolor_1 = require("randomcolor");
const { pool } = require("../handlers/databaseHandler");

async function getUserDaten(dcID) {
    return new Promise((resolve, reject) => {
        pool.query(
            "SELECT users.username, discord_tokens.userid FROM users INNER JOIN discord_tokens ON users.id=discord_tokens.userid WHERE discord_tokens.discord_id = ?",
            [dcID],
            (err, result) => {
            return err ? reject(err) : resolve(result);
        });
    });
}
async function getUserRecentDaten(uid) {
    return new Promise((resolve, reject) => {
        pool.query(
            "SELECT * FROM scores_master INNER JOIN beatmaps ON scores_master.beatmap_md5 = beatmaps.beatmap_md5 WHERE userid = ? AND special_mode = 1 ORDER BY time DESC",
            [uid],
            (err, result) => {
            return err ? reject(err) : resolve(result);
        });
    });
}

const subcommands = {

    /**
     * @param {import("discord.js").Client} client 
     * @param {import("discord.js").Message} message 
     * @param {string[]} args 
     */
    vanilla: async (client, message, args) => {
        const msg = args.join(" ")
        try {
            var user = await query("SELECT * FROM users WHERE username = ?", msg);
            // Special mode = 0 (vanilla) 1 (relax) 2 (scorev2)
            var recentScore = await query("SELECT * FROM scores_master INNER JOIN beatmaps ON scores_master.beatmap_md5 = beatmaps.beatmap_md5 WHERE userid = ? AND special_mode = 0 ORDER BY time DESC;", user[0].id)
            let color = randomcolor_1.randomColor();
            let hex = parseInt(color.replace(/^#/, ''), 16);

            const embed = new Discord.MessageEmbed()
            .setTitle("Recent Score For " + msg)
            .setURL("https://osu.troke.id/u/" + recentScore[0].userid)
            .setColor(hex)
            .setDescription(recentScore[0].song_name)
		    .setThumbnail("https://a.troke.id/" + user[0].id)
            .setImage("https://assets.ppy.sh/beatmaps/" + recentScore[0].beatmapset_id + "/covers/cover.jpg")
            .addField("PP:", recentScore[0].pp)
            .addField("Score:", recentScore[0].score)
            .addField("Accuracy:", Math.round(recentScore[0].accuracy) + "%")
            message.channel.send(embed);
        } catch (ex) {
            message.channel.send("User doesn't exist");
        }
    },

    /**
     * @param {import("discord.js").Client} client 
     * @param {import("discord.js").Message} message 
     * @param {string[]} args 
     */
    relax: async (client, message, args) => {
        try {
            var AmbilID = message.author.id;
            var user = await getUserDaten(AmbilID);
            // Special mode = 0 (vanilla) 1 (relax) 2 (scorev2)
            var recentScore = await getUserRecentDaten(user[0].userid);
            let color = randomcolor_1.randomColor();
            let hex = parseInt(color.replace(/^#/, ''), 16);
            
            const embed = new Discord.MessageEmbed()
            .setTitle("Recent Score For " + user[0].username)
            .setURL("https://osu.troke.id/rx/u/" + user[0].userid)
            .setColor(hex)
            .setDescription(recentScore[0].artist + " - " + recentScore[0].title + " [" + recentScore[0].difficulty_name + "]")
            .setThumbnail("https://a.troke.id/" + user[0].userid)
            .setImage("https://assets.ppy.sh/beatmaps/" + recentScore[0].beatmapset_id + "/covers/cover.jpg")
            .addField("PP:", recentScore[0].pp)
            .addField("Score:", recentScore[0].score)
            .addField("Accuracy:", Math.round(recentScore[0].accuracy) + "%")
            message.channel.send(embed);
        } catch (ex) {
            console.log(ex);
            message.channel.send("User doesn't exist");
        }
    }

    //# Recent subcommand template
    //nama: (client, message, args) => {
    //# code command
    //}
}

module.exports = {
    name: "recent",

    /**
     * @param {import("discord.js").Client} client 
     * @param {import("discord.js").Message} message 
     * @param {string[]} args 
     */
    run: async (client, message, args) => {
        if(!args.length || !args[0]) return message.channel.send("This is not a valid option.");
        const subcmd = args.shift()
        const sub = subcommands[subcmd]
        if(!sub) return;

        return sub(client, message, args)
    }
}