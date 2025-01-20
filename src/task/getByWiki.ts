import { join } from '@std/path';
import { Vcalendar, VcalendarBuilder } from '../BaseUtil.ts';
import { getAllEvents } from '../WikiController.ts';
import { ReleaseJsonType } from '../type/ReleaseJsonType.ts';
import { UID_PREFIX } from '../Const.ts';


async function main() {
    const events = await getAllEvents();

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

    const jsonItems: ReleaseJsonType = [];
    for (let i = 0; i < events.length; i++) {
        const item = events[i];

        vcalendar.items.push({
            uid: UID_PREFIX + item.id,
            dtstamp: vcalendar.dateToDateTime(new Date()),
            dtstart: vcalendar.dateToDateTime(item.start),
            dtend: vcalendar.dateToDateTime(item.end),
            summary: item.name,
            description: item.description
        });
        jsonItems.push({
            id: item.id,
            name: item.name,
            start: item.start.toISOString(),
            end: item.end.toISOString(),
            description: item.description
        });

        console.log(`${i + 1}/${events.length}`);
    }

    const icsSavePath = join(Deno.cwd(), 'release.ics');
    Deno.writeTextFileSync(icsSavePath, vcalendar.toString());
    console.log(`[√] ICS Has Save To "${icsSavePath}"`);

    const jsonSavePath = join(Deno.cwd(), 'release.json');
    Deno.writeTextFileSync(jsonSavePath, JSON.stringify(jsonItems, null, 4));
    console.log(`[√] Json Has Save To "${jsonSavePath}"`);
}
main();
