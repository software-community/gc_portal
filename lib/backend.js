// app/api/database.js         
import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import data from './DB.json' with {type: "json"}
import db from "./db"
import { createHelia } from 'helia'
import { strings } from '@helia/strings'

const helia = await createHelia()
const s = strings(helia)



const bytes32 = e => ethers.encodeBytes32String(e);
const abiManager = (data.ABI && data.ABI.GC_MANAGER) ? data.ABI.GC_MANAGER : [];
const provider = new ethers.JsonRpcProvider(data.RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const GC_Manager = new ethers.Contract(data.Manager_Contract_Address, abiManager, wallet);

GC_Manager.on("GC_Created", async (AY, address) => {
    let id = await db.GC.add(ethers.decodeBytes32String(AY), address)
    id = id._id
    const GC_Ctrct = ethers.Contract(address, data.ABI.GC, wallet)

    GC_Ctrct.on("Contest_event", async (ev, name) => {
        name = ethers.decodeBytes32String(name);
        if (ev === "added") {
            db.contest.verify({ name, GC: id })
        }
        if (ev === "updated") {
            db.contest.verify({ name, GC: id })
        }
        if (ev === "removed") {
            db.contest.remove({ name, GC: id })
        }
    })
}
)
GC_Ctrct.on("Hostel_event", async (ev, hostel, AY) => {
    hostel = ethers.decodeBytes32String(hostel);
    AY = ethers.decodeBytes32String(AY);
    if (ev === "added") {
        db.hostel.add(hostel,AY)
    }
    if (ev === "removed") {
        db.hostel.remove( hostel,AY)
    }
})


const GC = async AY => {
    const year = bytes32(AY);
    const contract_address = await GC_Manager.retrieve_GC(year);
    const GC = new ethers.Contract(contract_address, abiGC, wallet);

    const getScore = async (Leg, Contest, Hostel) => {
        try {
            const allScores = {};
            if (!Leg) {
                for (const leg in data.Legs) {
                    allScores[leg] = {};
                    const contests = await db.contest.get(leg);
                    for (const contest of contests) {
                        allScores[leg][contest] = {};
                        const teams = db.partcicpant.get();
                        for (const team of teams) {
                            allScores[leg][contest][team] = await GC.Scores(data.Legs[leg], bytes32(contest), bytes32(team));
                        }
                    }
                }
                return allScores;
            }
            else if (!Contest) {
                const contests = await db.contest.get(Leg);
                for (const contest of contests) {
                    allScores[Leg][contest] = {};
                    const teams = db.partcicpant.get();
                    for (const team of teams) {
                        allScores[Leg][contest][team] = await GC.Scores(data.Legs[Leg], bytes32(contest), bytes32(team));
                    }
                }
                return allScores;
            }
            else if (!Hostel) {
                const teams = db.partcicpant.get();
                for (const team of teams) {
                    allScores[Leg][Contest][team] = await GC.Scores(data.Legs[Leg], bytes32(Contest), bytes32(team));
                }
                return allScores;
            }
            else {
                allScores = 0
                allScores = await GC.Scores(data.Legs[Leg], bytes32(Contest), bytes32(Hostel));
                return allScores;
            }

        } catch (error) {
            console.error('Error fetching all scores:', error);
            throw error;
        }

    }
    const get_Score_Dist= async(Leg, Contest) => {
        const str = await db.contest.get({name:Contest,leg:Leg})
        str=str[0].points_distribution
        return await s.get(str)
    }
    const status = async () => (await GC.is_active() ? "Active" : "Inactive")
    return { getScore, get_Score_Dist, status }
}

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    let AY;
    switch (searchParams.get("task")) {
        case "Get_Score":
            AY = searchParams.get('AY');
            const Leg = searchParams.get('Leg');
            const Contest = searchParams.get('Contest');
            const Hostel = searchParams.get('Hostel');

            const score = await GC(AY).getScore(Leg, Contest, Hostel)
            if (typeof score === "object") return NextResponse.json(score);
            else return NextResponse.json({ score });
            break;

        case "Get_Score_Dist":
            AY = searchParams.get('AY');
            const score_dist = await (await GC(AY)).get_Score_Dist(searchParams.get('Leg'), searchParams.get('Contest'))
            return NextResponse.json({ dist:score_dist });
            break;

        case "Get_Status":
            AY = searchParams.get('AY');
            const status = await GC(AY).status()
            return NextResponse.json({ status });
            break;
        case "Get_Legs":
            AY = searchParams.get('AY');
            const legs = data.Legs
            return NextResponse.json({ legs });
            break
        case "Get_Hostels":
            const hostels = db.hostel.get({})
            return NextResponse.json({ hostels });
            break;
        case "Get_Contests":
            const leg = searchParams.get("Leg");
            const contests = await db.contest.get(leg);
            return NextResponse.json({ contests });
            break;

        case "Get_ABI":
            if (!(await GC_Manager.verify_caller(address))) NextResponse.json({ status: "Unauthorised Action" }, { status: 401 })
            return NextResponse.json({ ABI: data.ABI });
            break;
    }

}

export async function POST(request) {
    const body = await request.json();
    if (body.task === "addEvent") {
        body.data.GC = (await db.GC.get(body.AY))[0]._id;
        db.contest.add(body.data)
    }
    if (body.task === "updateEvent") {
        db.contest.update(body.id, body.update);
    }
    let dist = {}
    if (body.task === "updateScore") {
        const GC = await db.GC.get(body.AY)
        const Ctrct = ethers.Contract(GC[0].contractAddress, data.ABI.GC, wallet)
        dist[body.Id] = body.dist
        Ctrct.on("updateScore", async (Id) => {
            const cid = await s.add(data)
            db.contest.add_score_dist(dist[Id], cid.toString())
            delete dist[Id]
        })
    }
}