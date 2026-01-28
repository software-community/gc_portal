import { ethers } from 'https://cdnjs.cloudflare.com/ajax/libs/ethers/6.15.0/ethers.min.js';
import data from './DB.json' with {type: "json"}

async function postData( data = {}) {
  try {
    const response = await fetch(data.backEndURI, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    // Check if the response is okay (status 200-299)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json(); 
  } catch (error) {
    console.error('Post Request Failed:', error);
    throw error;
  }
}

const abiManager = (data.ABI && data.ABI.GC_MANAGER) ? data.ABI.GC_MANAGER : [];
const abiGC = (data.ABI && data.ABI.GC) ? data.ABI.GC : [];
const bytes32 = e => ethers.encodeBytes32String(e);


let signer = null;

let provider;
if (!window.ethereum) {
    console.error("MetaMask not installed; using read-only defaults")
    provider = ethers.getDefaultProvider()
}else {

    provider = new ethers.BrowserProvider(window.ethereum)
    signer = await provider.getSigner();
}

const GC_Manager = new ethers.Contract(data.Manager_Contract_Address, abiManager, signer);


const GCManager = () => {
  const deploy_GCManager=async()=>{
    const deployable =  new ethers.ContractFactory(abiManager,bytecode,signer)
    const contract=await deployable.deploy()
    return contract.address
  }

  const is_admin=async ()=>{
    return(await GC_Manager.verify_caller(signer.getAddress()))
  }

  const add_admin = async addr =>     await GC_Manager.add_admin_rights(addr);
  const remove_admin = async addr =>     await GC_Manager.remove_admin_rights(addr);
  
  const create_GC = async AY =>    await GC_Manager.create_GC(bytes32(AY))
  const end_GC = async AY =>    await GC_Manager.end_GC(bytes32(AY))

  const GC = async AY => {
    const year = bytes32(AY);
    const contract_address = await GC_Manager.retrieve_GC(year);
    
    if (!contract_address || contract_address === ethers.ZeroAddress) {
      throw new Error(`No GC contract found for year ${AY}. Please create one first using create_GC().`);
    }
    
    const GCContract = new ethers.Contract(contract_address, abiGC, provider);

    const add_Participant = async team => {
      await GCContract.add_Participant(bytes32(team))
    }
    const remove_Participant = async team => {
      await GCContract.remove_Participant(bytes32(team))
    }
    const set_Score = async (Leg, Contest, Participant, Score) => {
      await GCContract.set_Score(data.Legs[Leg], bytes32(Contest), bytes32(Participant), Score)
    }
    const add_Contest = async (Leg, dat) => {
      await GCContract.add_Contest(data.Legs[Leg], bytes32(dat.Contest))
      postData(dat)
    }
    const remove_Contest = async (Leg, Contest) => {
      await GCContract.remove_Contest(data.Legs[Leg], bytes32(Contest))
    }

    const getScore = async (Leg, Contest, Participant) => {
        try {
            const allScores = {};
            if (!Leg) {
                for (const leg in data.Legs) {
                    allScores[leg] = {};
                    const contests = await db.contest.get(leg);
                    for (const contest of contests) {
                        allScores[leg][contest] = {};
                        const teams = db.participant.get();
                        for (const team of teams) {
                            allScores[leg][contest][team] = await GCContract.Scores(data.Legs[leg], bytes32(contest), bytes32(team));
                        }
                    }
                }
                return allScores;
            }
            else if (!Contest) {
                const contests = await db.contest.get(Leg);
                for (const contest of contests) {
                    allScores[Leg][contest] = {};
                    const teams = db.participant.get();
                    for (const team of teams) {
                        allScores[Leg][contest][team] = await GCContract.Scores(data.Legs[Leg], bytes32(contest), bytes32(team));
                    }
                }
                return allScores;
            }
            else if (!Participant) {
                const teams = db.participant.get();
                for (const team of teams) {
                    allScores[Leg][Contest][team] = await GCContract.Scores(data.Legs[Leg], bytes32(Contest), bytes32(team));
                }
                return allScores;
            }
            else {
                allScores = 0
                allScores = await GCContract.Scores(data.Legs[Leg], bytes32(Contest), bytes32(Participant));
                return allScores;
            }
        } catch (error) {
            console.error('Error fetching all scores:', error);
            throw error;
        }
    }
    const status = async () => (await GCContract.is_active() ? "Active" : "Inactive")
    const deactivate = async () => {
      await GCContract.deactivate()
    }
    return {add_Participant, remove_Participant, add_Contest, remove_Contest, set_Score, getScore, deactivate, status }
  }
  return { deploy_GCManager,is_admin, add_admin, remove_admin, create_GC, end_GC, GC }
}

export {GCManager}

export {GCManager}
