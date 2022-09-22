import { getLatestBlock } from "@defillama/sdk/build/util";
import { FetchResult } from "../dexVolume.type";

export const ERROR_STRING = '------ ERROR ------'

export function checkArguments(argv: string[]) {
    if (argv.length < 3) {
        console.error(`Missing argument, you need to provide the filename of the adapter to test.
    Eg: ts-node dexVolumes/cli/testAdapter.js dexVolumes/myadapter.js`);
        process.exit(1);
    }
}

export async function getLatestBlockRetry(chain: string) {
    for (let i = 0; i < 5; i++) {
        try {
            return await getLatestBlock(chain);
        } catch (e) {
            throw new Error(`Couln't get block heights for chain "${chain}"\n${e}`);
        }
    }
}

export function printVolumes(volumes: (FetchResult & { chain: string, startTimestamp?: number })[]) {
    volumes.forEach((element) => {
        console.info(element.chain.toUpperCase(), "👇")
        if (element.startTimestamp !== undefined)
            console.info(`Start time: ${formatTimestampAsDate(String(element.startTimestamp))}`)
        else console.info("Start time not defined")
        console.info(`Daily: ${element.dailyVolume}`)
        console.info(`Total: ${element.totalVolume}`)
    });
}

export function formatTimestampAsDate(timestamp: string) {
    const date = new Date(Number(timestamp) * 1000);
    return `${date.getUTCDate()}/${date.getUTCMonth() + 1}/${date.getUTCFullYear()}`;
}
