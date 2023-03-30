import PogObject from "../PogData"

const pog = new PogObject("meterthing", {
    magic_find: 0,
})


register("chat", (message, event) => {
    if (message.startsWith("   RNG Meter -")) {
        console.log(Scoreboard.getLineByIndex(3).getName())
        if (Scoreboard.getLineByIndex(3).getName().includes("Voidgloom") && Scoreboard.getLineByIndex(3).getName().includes("IV")) {
            // get the amount of xp from the message using regex
            // the message is formatted like this: "   RNG Meter - 209,000 Stored XP"
            // so we need to get the number and remove the commas
            let xp = message.match(/\d{1,3}(?:,\d{3})*(?:\.\d+)?/g)[0];
            xpStripped = parseInt(xp.replace(/[,]/g,''))
            let coreChance = (0.0565 * (1 + (2 * xpStripped/885000)))
            let coreChanceMagicFind = (coreChance * (1 + (pog.magic_find / 100)))
            cancel(event)
            ChatLib.chat("   &dRNG Meter &f- &d" + xp + "/885,000 Stored XP &8(" + Math.floor(xpStripped / 500) + "/" + 885000 / 500 + ")");
            ChatLib.chat("   &7↪ &6Judgement Core &7Chance: &b" + coreChanceMagicFind.toFixed(4) + "% +" + pog.magic_find + "✯ &8(" + coreChance.toFixed(4) + "% base)");
    }
    }

}
).setCriteria("${message}");

register("chat", (message, event) => {
    // check if the message is a rare drop using regex
    console.log(message)
    if (message.match(/^(RARE DROP!|VERY RARE DROP!|INSANE DROP!|CRAZY RARE DROP!)\s\(/g)) {
        let itemName = message.match(/\(([^)]+)\)/g)[0];
        let magicFind = message.match(/\(([^)]+)\)/g)[1];
        // remove everything from magicFind except the number
        magicFind = magicFind.replace(/[^0-9]/g, '');
        pog.magic_find = magicFind
        pog.save()
    }
}).setCriteria("${message}");