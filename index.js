import PogObject from "../PogData"
import request from "../requestV2"
import sleep from "../sleep"
import droptables from "./eman-droptables.js";

const API_URL = "https://api.domyjobfor.me/meterthing"
const pog = new PogObject("meterthing", {
    magic_find: 0,
    since_last_rng: 0,
    last_rng_dropped_at: new Date().getTime(),
    since_last_core: 0,
    last_core_dropped_at: new Date().getTime(),
    since_last_incarnate: 0,
    last_incarnate_dropped_at: new Date().getTime(),
    current_meterthing_version: "0",
    rng_meter_selected_item: "JUDGEMENT_CORE",
    rng_meter_selected_table: "mainTable"
})

let lastMagicFindMessage
let lastXP

let checkedForUpdateThisSession = false;


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
            let xpPercentage = xpStripped / droptables[pog.rng_meter_selected_table][pog.rng_meter_selected_item].required_xp;
            let requiredXpWithCommas = droptables[pog.rng_meter_selected_table][pog.rng_meter_selected_item].required_xp.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            let meterMessage = new TextComponent(`   &dRNG Meter &f- &d${xp}/${requiredXpWithCommas} XP &8(${Math.floor(xpStripped / 500)}/${Math.floor(droptables[pog.rng_meter_selected_table][pog.rng_meter_selected_item].required_xp / 500)})`).setClick("run_command", `${clickaction}`).setHoverValue(`&7Your RNG meter is &d${(xpPercentage * 100).toFixed(2)}% &7filled!\n&7Click to open RNG Meter menu.`);
            cancel(event)
            ChatLib.chat(meterMessage);
            let magicFindMessage = calculateMagicFind();
            magicFindMessage.chat()
            lastMagicFindMessage = magicFindMessage
            pog.since_last_rng += 1
            pog.since_last_core += 1
            pog.since_last_incarnate += 1
            pog.save()
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
        lastMagicFindMessage.edit(calculateMagicFind())
        // wait for a bit so the message is sent after the drop message
        sleep(50, () => {
            if (message.match(/^(CRAZY RARE DROP!)\s\(/g)) {
                if (itemName.includes("Judgement Core")) {
                    let sinceLastCoreMessage = new Message("  &7↪ &7Bosses since last &6Judgement Core&7: &b" + pog.since_last_core)
                    let timeSinceLastCoreMessage = new Message("  &7↪ &7Time since last &6Judgement Core&7: " + buildSinceLastTimeMessage(pog.last_core_dropped_at))
                    sinceLastCoreMessage.chat()
                    timeSinceLastCoreMessage.chat()
                    pog.last_core_dropped_at = new Date().getTime()
                    pog.since_last_core = 0
                    pog.save()
                }
                let sinceLastRNGMessage = new Message("  &7↪ &7Bosses since last &d&lRNG&7: &6" + pog.since_last_rng)
                let timeSinceLastRNGMessage = new Message("  &7↪ &7Time since last &d&lRNG&7: " + buildSinceLastTimeMessage(pog.last_rng_dropped_at))
                sinceLastRNGMessage.chat()
                timeSinceLastRNGMessage.chat()
                pog.last_rng_dropped_at = new Date().getTime()
                pog.since_last_rng = 0
                pog.save()
            } else if (message.match(/^(INSANE DROP!)\s\(/g)) {
                let sinceLastIncarnateMessage = new Message("  &7↪ &7Bosses since last &c&lINCARNATE&7: &5" + pog.since_last_incarnate)
                let timeSinceLastIncarnateMessage = new Message("  &7↪ &7Time since last &c&lINCARNATE&7: " + buildSinceLastTimeMessage(pog.last_incarnate_dropped_at))
                sinceLastIncarnateMessage.chat()
                timeSinceLastIncarnateMessage.chat()
                pog.last_incarnate_dropped_at = new Date().getTime()
                pog.since_last_incarnate = 0
                pog.save()
            }
        })
    }
}).setCriteria("${message}");

function calculateMagicFind() {
    let selectedItemWeight = droptables.mainTable[pog.rng_meter_selected_item].weight;
    let totalWeight = 0;
    let itemName;

    // Apply buff from RNG meter to the weight of the selected item
    selectedItemWeight = selectedItemWeight * (1 + Math.min((2 * lastXP / droptables[pog.rng_meter_selected_table][pog.rng_meter_selected_item].required_xp), 2));
    itemName = droptables[pog.rng_meter_selected_table][pog.rng_meter_selected_item].name;

    // Calculate the total weight of the table
    for (let item in droptables.mainTable) {
        let magicFind = pog.magic_find;
        if (item == pog.rng_meter_selected_item) {
            continue;
        }
        let itemWeight = droptables.mainTable[item].weight;
        // Apply magic find
        if (droptables.mainTable[item].magic_find) {
            itemWeight = itemWeight * (1 + (magicFind / 100));
            totalWeight += itemWeight;
        } else {
            totalWeight += itemWeight;
        }
    }

    if (pog.rng_meter_selected_table == "cosmeticTable") {
      for (let item in droptables.cosmeticTable) {
        let magicFind = pog.magic_find;
        if (item == pog.rng_meter_selected_item) {
            continue;
        }
        let itemWeight = droptables.cosmeticTable[item].weight;
        // Apply magic find
        if (droptables.cosmeticTable[item].magic_find) {
            itemWeight = itemWeight * (1 + (magicFind / 100));
            totalWeight += itemWeight;
        } else {
            totalWeight += itemWeight;
        }
      }
    }

    selectedItemWeight = selectedItemWeight * (1 + (pog.magic_find / 100));
    totalWeight += selectedItemWeight;

    // Get the chance of the selected item dropping
    let chancePercentage = (selectedItemWeight / totalWeight) * 100;
    let totalBosses = totalWeight / selectedItemWeight;
    let newMessage = new Message(`   &7↪ ${itemName} &7Chance: &b${chancePercentage.toFixed(5)}% ${pog.magic_find}✯ &8(1/${totalBosses.toFixed(0)})\n   &7↪ ${itemName} &7Weight: &a${selectedItemWeight.toFixed(2)}&7/${totalWeight.toFixed(0)}`)


    return newMessage;
}

function buildSinceLastTimeMessage(lastTime) {
    let stringBuilder = "";
    // use the stringBuilder to append the time
    let currentTime = new Date().getTime();
    let timeSince = currentTime - lastTime;
    let seconds = Math.floor(timeSince / 1000);
    let minutes = Math.floor(seconds / 60);
    let hours = Math.floor(minutes / 60);
    let days = Math.floor(hours / 24);
    if (days > 0) {
        stringBuilder += "&a" + days + "d ";
    }
    if (hours > 0) {
        stringBuilder += "&a" + hours % 24 + "h ";
    }
    if (minutes > 0) {
        stringBuilder += "&a" + minutes % 60 + "m ";
    }
    if (seconds > 0) {
        stringBuilder += "&a" + seconds % 60 + "s.";
    }
    return stringBuilder;
}

register("worldLoad", () => {
    if (checkedForUpdateThisSession) return;
    request({
        url: `${API_URL}/version`,
        method: "GET",
        resolveWithFullResponse: true,
        headers: {
            "User-Agent": "Mozilla/5.0"
        },
        connectTimeout: 5000,
    })
    .then((response) => {
        let data = JSON.parse(response.body)
        let currentFileVersion = JSON.parse(FileLib.read("meterthing", "metadata.json")).version
        let latestVersion = data.version
        if (data.version != pog.current_meterthing_version && data.version == currentFileVersion) {
            ChatLib.chat("&d-------------------------")
            ChatLib.chat("&fmeterthing has been updated to version " + latestVersion)
            ChatLib.chat("")
            ChatLib.chat("&fchangelog:")
            for (let i = 0; i < data.changelog.length; i++) {
                ChatLib.chat("&d- &7" + data.changelog[i])
            }
            ChatLib.chat("")
            ChatLib.chat("&fthanks for using meterthing")
            ChatLib.chat("&d-------------------------")
            pog.current_meterthing_version = latestVersion;
            pog.save();
            checkedForUpdateThisSession = true;
        }
    })
    .catch((error) => {
        ChatLib.chat("&can error occurred while checking meterthing version. :("); 
        ChatLib.chat("&7Please report this error to the developer:")
        ChatLib.chat("&8" + error)
        checkedForUpdateThisSession = true;
    });
})