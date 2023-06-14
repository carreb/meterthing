import PogObject from "../PogData"

const pog = new PogObject("meterthing", {
    magic_find: 0,
})

let lastMagicFindMessage
let lastXP


register("chat", (message, event) => {
    let doingVoidgloom = false
    for(let i = 0; i < Scoreboard.getLines().length; i++) {
        if (Scoreboard.getLineByIndex(i).getName().includes("Voidgloom") && Scoreboard.getLineByIndex(i).getName().includes("IV")) {
            doingVoidgloom = true
        }
    }
    if (message.startsWith("   RNG Meter -")) {
        console.log(Scoreboard.getLineByIndex(5).getName())
        if (doingVoidgloom) {
            // get the amount of xp from the message using regex
            // the message is formatted like this: "   RNG Meter - 209,000 Stored XP"
            // so we need to get the number and remove the commas
            let originalMessage = new Message(event)
            let clickaction = originalMessage.getMessageParts()[0].getClickValue()
            let xp = message.match(/\d{1,3}(?:,\d{3})*(?:\.\d+)?/g)[0];
            xpStripped = parseInt(xp.replace(/[,]/g,''))
            lastXP = xpStripped
            let coreChance = (0.0565 * (1 + (2 * xpStripped/885000)))
            let coreChanceMagicFind = (coreChance * (1 + (pog.magic_find / 100)))
            let xpPercentage = xpStripped / 885000;
            let meterMessage = new TextComponent("   &dRNG Meter &f- &d" + xp + "/885,000 Stored XP &8(" + Math.floor(xpStripped / 500) + "/" + 885000 / 500 + ")").setClick("run_command", `${clickaction}`).setHoverValue(`&7Your RNG meter is &d${(xpPercentage * 100).toFixed(2)}% &7filled!\n&7Click to open RNG Meter menu.`);
            cancel(event)
            ChatLib.chat(meterMessage);
            let magicFindMessage = new Message("   &7↪ &6Judgement Core &7Chance: &b" + coreChanceMagicFind.toFixed(4) + "% +" + pog.magic_find + "✯ &8(" + coreChance.toFixed(4) + "% base)");
            magicFindMessage.chat()
            lastMagicFindMessage = magicFindMessage
        }
    }

}
).setCriteria("${message}");

register("chat", (message, event) => {
    // check if the message is a rare drop using regex
    if (message.match(/^(RARE DROP!|VERY RARE DROP!|INSANE DROP!|CRAZY RARE DROP!)\s\(/g)) {
        let itemName = message.match(/\(([^)]+)\)/g)[0];
        let magicFind = message.match(/\(([^)]+)\)/g)[1];
        // remove everything from magicFind except the number
        magicFind = magicFind.replace(/[^0-9]/g, '');
        pog.magic_find = magicFind
        pog.save()
        recalculateMagicFind()
    }
}).setCriteria("${message}");

function recalculateMagicFind() {
     let coreChance = 0.0565 * (1 + (2 * xpStripped) / 885000);
     let coreChanceMagicFind = coreChance * (1 + pog.magic_find / 100);
     let newMessage = new Message("   &7↪ &6Judgement Core &7Chance: &b" + coreChanceMagicFind.toFixed(4) + "% +" + pog.magic_find + "✯ &8(" + coreChance.toFixed(4) + "% base)")
     lastMagicFindMessage.edit(newMessage)
}