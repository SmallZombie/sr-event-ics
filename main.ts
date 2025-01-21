import { join } from '@std/path';
import { Vcalendar, VcalendarBuilder } from './src/BaseUtil.ts';
import { getAllEvents } from './src/WikiController.ts';
import { ReleaseJsonType } from './src/type/ReleaseJsonType.ts';
import { UID_PREFIX } from './src/Const.ts';
import { existsSync } from '@std/fs/exists';


const icsPath = join(Deno.cwd(), 'release.ics');
function getICS(): Vcalendar {
    if (existsSync(icsPath)) {
        return Vcalendar.fromString(Deno.readTextFileSync(icsPath));
    } else {
        const builder = new VcalendarBuilder();
        const vcalendar: Vcalendar = builder
            .setVersion('2.0')
            .setProdId('-//SmallZombie//SR Event ICS//ZH')
            .setName('崩坏：星穹铁道活动')
            .setRefreshInterval('P1D')
            .setCalScale('GREGORIAN')
            .setTzid('Asia/Shanghai')
            .setTzoffset('+0800')
            .build();
        return vcalendar;
    }
}

const jsonPath = join(Deno.cwd(), 'release.json');
function getJson(): ReleaseJsonType {
    if (existsSync(jsonPath)) {
        return JSON.parse(Deno.readTextFileSync(jsonPath)) as ReleaseJsonType;
    } else {
        return [];
    }
}

async function main() {
    const ics = getICS();
    const json = getJson();
    const events = await getAllEvents();

    let needSaveICS = false;
    let needSaveJSON = false;
    console.log('[!] Total Events: ', events.length);
    for (let i = 0; i < events.length; i++) {
        const item = events[i];
        const dtstart = ics.dateToDateTime(item.start);
        const dtend = ics.dateToDateTime(item.end);

        let needSaveICSInThisCycle = false;
        let icsItem = ics.items.find(v => v.uid === UID_PREFIX + item.id);
        if (icsItem) {
            if (icsItem.dtstart + 'Z' !== dtstart) {
                icsItem.dtstart = dtstart;
                needSaveICSInThisCycle = true;
            }
            if (icsItem.dtend + 'Z' !== dtend) {
                icsItem.dtend = dtend;
                needSaveICSInThisCycle = true;
            }
            if (icsItem.description !== item.description) {
                icsItem.description = item.description;
                needSaveICSInThisCycle = true;
            }
        } else {
            icsItem = {
                uid: UID_PREFIX + item.id,
                dtstamp: ics.dateToDateTime(new Date()),
                dtstart: ics.dateToDateTime(item.start),
                dtend: ics.dateToDateTime(item.end),
                summary: item.name,
                description: item.description
            }
            ics.items.push(icsItem);
            needSaveICSInThisCycle = true;
        }
        if (needSaveICSInThisCycle) {
            console.log(`${i + 1}/${events.length} Update "${item.name}"(${item.id}) in ICS`);

            icsItem.dtstamp = ics.dateToDateTime(new Date());
            needSaveICS = true;
        }

        let needSaveJSONInThisCycle = false;
        const jsonItem = json.find(v => v.id === item.id);
        if (jsonItem) {
            if (jsonItem.start !== item.start.toISOString()) {
                jsonItem.start = item.start.toISOString();
                needSaveJSONInThisCycle = true;
            }
            if (jsonItem.end !== item.end.toISOString()) {
                jsonItem.end = item.end.toISOString();
                needSaveJSONInThisCycle = true;
            }
            if (jsonItem.description !== item.description) {
                jsonItem.description = item.description;
                needSaveJSONInThisCycle = true;
            }
        } else {
            json.push({
                id: item.id,
                name: item.name,
                start: item.start.toISOString(),
                end: item.end.toISOString(),
                description: item.description
            });
            needSaveJSONInThisCycle = true;
        }
        if (needSaveJSONInThisCycle) {
            console.log(`${i + 1}/${events.length} Update "${item.name}"(${item.id}) in JSON`);
            needSaveJSON = true;
        }
    }

    if (needSaveICS) {
        const icsSavePath = join(Deno.cwd(), 'release.ics');
        Deno.writeTextFileSync(icsSavePath, ics.toString());
        console.log(`[√] ICS Has Save To "${icsSavePath}"`);
    }

    if (needSaveJSON) {
        const jsonSavePath = join(Deno.cwd(), 'release.json');
        Deno.writeTextFileSync(jsonSavePath, JSON.stringify(json, null, 4));
        console.log(`[√] JSON Has Save To "${jsonSavePath}"`);
    }

    if (!needSaveICS && !needSaveJSON) {
        console.log('[-] No need to save');
    }
}
main();
