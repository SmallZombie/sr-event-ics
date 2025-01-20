import { existsSync } from '@std/fs';
import { join } from '@std/path';
import { Vcalendar } from '../BaseUtil.ts';
import { getAllEvents } from '../WikiController.ts';
import type { ReleaseJsonType } from '../type/ReleaseJsonType.ts';
import { UID_PREFIX } from '../Const.ts';


async function update() {
    const icsPath = join(Deno.cwd(), 'release.ics');
    const jsonPath = join(Deno.cwd(), 'release.json');

    if (!existsSync(icsPath)) {
        throw new Error('Cannot update because release.ics does not exist');
    }
    if (!existsSync(jsonPath)) {
        throw new Error('Cannot update because release.json does not exist');
    }

    const icsData = Deno.readTextFileSync(icsPath);
    const jsonData = Deno.readTextFileSync(jsonPath);

    const ics = Vcalendar.fromString(icsData);
    const json = JSON.parse(jsonData) as ReleaseJsonType;

    const result = await getAllEvents();

    // 检查新增
    const newItems = result.filter(v => !ics.items.some(vv => vv.uid === UID_PREFIX + v.id.toString()));
    if (!newItems.length) {
        console.log('[-] No new events');
        return;
    }

    for (const i of newItems) {
        ics.items.push({
            uid: UID_PREFIX + i.id,
            dtstamp: ics.dateToDateTime(new Date()),
            dtstart: ics.dateToDateTime(i.start),
            dtend: ics.dateToDateTime(i.end),
            summary: i.name,
            description: i.description
        });
        json.push({
            id: i.id,
            name: i.name,
            start: i.start.toISOString(),
            end: i.end.toISOString(),
            description: i.description
        });

        console.log(`[√] "${i.name}"(${i.id}) has been added`);
    }

    Deno.writeTextFileSync(icsPath, ics.toString());
    console.log(`[√] ICS Has Save To "${icsPath}"`);

    Deno.writeTextFileSync(jsonPath, JSON.stringify(json, null, 2));
    console.log(`[√] JSON Has Save To "${jsonPath}"`);
}
await update();
