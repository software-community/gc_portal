import { expect } from 'chai';
import { network } from "hardhat";

const { ethers } = await network.connect();

const bytes32 = e => ethers.encodeBytes32String(e);

const Leg = {
  Tech: 0,
  Sports: 1,
  Cult: 2
};

describe("Manager Tests", () => {
  it("Manager To Be Able To Add Other Admins", async () => {
    const [owner, admin1, admin2, nonAdmin] = await ethers.getSigners();
    const GC_Manager = await ethers.deployContract("GC_Manager");

    //T1

    // Check if the manager is correctly set to the owner
    expect(await GC_Manager.manager()).to.equal(owner.address);


    await GC_Manager.add_admin_rights(admin1.address);


    // Verify that a non-admin cannot add admin rights
    await expect(GC_Manager.connect(nonAdmin).add_admin_rights(admin1.address)).to.be.revertedWith("Unauthorised Action!");

    await GC_Manager.connect(admin1).add_admin_rights(nonAdmin.address);

    // Verify that the new admin has been successfully added
    expect(await GC_Manager.verify_caller(nonAdmin.address)).to.equal(true);

  });

  it("Manager can remove admin", async () => {
    const [owner, admin1] = await ethers.getSigners();

    const GC_Manager = await ethers.deployContract("GC_Manager");


    // Manager adds admin
    await GC_Manager.add_admin_rights(admin1.address);


    // Verify that admin1 is initially an admin
    expect(await GC_Manager.verify_caller(admin1.address)).to.equal(true);



    // Manager removes admin
    await GC_Manager.remove_admin_rights(admin1.address);


    // Verify that admin1 is no longer an admin after removal
    expect(await GC_Manager.verify_caller(admin1.address)).to.equal(false);


    // Removed admin should not be able to add new admins

    // Verify that the removed admin cannot add new admins
    await expect(GC_Manager.connect(admin1).add_admin_rights(owner.address)).to.be.revertedWith("Unauthorised Action!");
  });

  it("Open and Close GCs by managers", async () => {
    const [owner, admin1] = await ethers.getSigners();

    const GC_Manager = await ethers.deployContract("GC_Manager");
    await GC_Manager.create_GC(bytes32("2025-2026"));
    const gcAddress = await GC_Manager.retrieve_GC(bytes32("2025-2026"));
    const GC = await ethers.getContractAt("GC", gcAddress);

    // Check if the GC is active after creation
    expect(await GC.is_active()).to.equal(true);

    await GC.deactivate();

    // Check if the GC is inactive after deactivation
    expect(await GC.is_active()).to.equal(false);

  });

  it("Open and Close GCs by Admins", async () => {
    const [owner, admin1] = await ethers.getSigners();

    const GC_Manager = await ethers.deployContract("GC_Manager");
    await GC_Manager.add_admin_rights(admin1.address);
    await GC_Manager.create_GC(bytes32("2025-2026"));
    const gcAddress = await GC_Manager.retrieve_GC(bytes32("2025-2026"));
    const GC = await ethers.getContractAt("GC", gcAddress);

    // Check if the GC is active after creation
    expect(await GC.is_active()).to.equal(true);

    await GC_Manager.connect(admin1).end_GC(bytes32("2025-2026"));

    // Check if the GC is inactive after being ended by an admin
    expect(await GC.is_active()).to.equal(false);

  });

  it("Add and Remove Hostel", async () => {
    const [owner, admin1, nonAdmin] = await ethers.getSigners();

    const GC_Manager = await ethers.deployContract("GC_Manager");
    await GC_Manager.create_GC(bytes32("2025-2026"));
    await GC_Manager.add_admin_rights(admin1.address);
    const gcAddress = await GC_Manager.retrieve_GC(bytes32("2025-2026"));
    const GC = await ethers.getContractAt("GC", gcAddress);
    await GC.add_Hostel(bytes32("Brahmaputra"));
    await GC.connect(admin1).add_Hostel(bytes32("Beas"));


    // Verify that the participant was added successfully
    expect(await GC.Hostels(bytes32("Brahmaputra"))).to.equal(true);


    // Verify the participant count is correct
    expect(await GC.participant_count()).to.equal(2);


    // Verify that a non-admin cannot remove a participant
    await expect(GC.connect(nonAdmin).remove_Hostel(bytes32("Brahmaputra"))).to.be.revertedWith("Unauthorised Action!");

    await GC.remove_Hostel(bytes32("Brahmaputra"));

    // Verify that the participant was removed successfully
    expect(await GC.Hostels(bytes32("Brahmaputra"))).to.equal(false);


    // Verify the participant count is correct after removal
    expect(await GC.participant_count()).to.equal(1);


  });
  // 1. Authorization and Access Control Tests
  it("Non-admin cannot create GC", async () => {
    const [owner, nonAdmin] = await ethers.getSigners();
    const GC_Manager = await ethers.deployContract("GC_Manager");
    
    // Verify that a non-admin cannot create a GC
    await expect(GC_Manager.connect(nonAdmin).create_GC(bytes32("2025-2026"))).to.be.revertedWith("Unauthorised Action!");
    
  });
  
  it("Non-admin cannot end GC", async () => {
    const [owner, nonAdmin] = await ethers.getSigners();
    const GC_Manager = await ethers.deployContract("GC_Manager");
    await GC_Manager.create_GC(bytes32("2025-2026"));
    
    // Verify that a non-admin cannot end a GC
    await expect(GC_Manager.connect(nonAdmin).end_GC(bytes32("2025-2026"))).to.be.revertedWith("Unauthorised Action!");
    
  });
  
  it("Removed admin cannot perform actions", async () => {
    const [owner, admin1] = await ethers.getSigners();
    const GC_Manager = await ethers.deployContract("GC_Manager");
    await GC_Manager.add_admin_rights(admin1.address);
    await GC_Manager.remove_admin_rights(admin1.address);
    
    // Verify that a removed admin cannot create a GC
    await expect(GC_Manager.connect(admin1).create_GC(bytes32("2025-2026"))).to.be.revertedWith("Unauthorised Action!");
    
    await GC_Manager.create_GC(bytes32("2025-2026"));
    
    // Verify that a removed admin cannot end a GC
    await expect(GC_Manager.connect(admin1).end_GC(bytes32("2025-2026"))).to.be.revertedWith("Unauthorised Action!");
    
  });
    
  it("Direct GC function calls by unauthorized users", async () => {
    const [owner, nonAdmin] = await ethers.getSigners();
    const GC_Manager = await ethers.deployContract("GC_Manager");
    await GC_Manager.create_GC(bytes32("2025-2026"));
    const gcAddress = await GC_Manager.retrieve_GC(bytes32("2025-2026"));
    const GC = await ethers.getContractAt("GC", gcAddress);
    
    // Verify that a non-admin cannot add a participant directly
    await expect(GC.connect(nonAdmin).add_Hostel(bytes32("Team"))).to.be.revertedWith("Unauthorised Action!");
    
    await GC.add_Hostel(bytes32("Team"));
    
    // Verify that a non-admin cannot remove a participant directly
    await expect(GC.connect(nonAdmin).remove_Hostel(bytes32("Team"))).to.be.revertedWith("Unauthorised Action!");
    
    
    // Verify that a non-admin cannot set a score directly
    await expect(GC.connect(nonAdmin).set_Score(Leg.Tech, bytes32("Contest"), bytes32("Team"), 50)).to.be.revertedWith("Unauthorised Action!");
    
  });
  
  
  it("Cannot end already ended or non-existent GC", async () => {
    const [owner] = await ethers.getSigners();
    const GC_Manager = await ethers.deployContract("GC_Manager");
    await GC_Manager.create_GC(bytes32("2025-2026"));
    const gcAddress = await GC_Manager.retrieve_GC(bytes32("2025-2026"));
    await GC_Manager.end_GC(bytes32("2025-2026"));
    const GC = await ethers.getContractAt("GC", gcAddress);

    // Verify that ending an already ended GC reverts
    await expect(GC["verify()"]()).to.be.revertedWith("Championship doesn't exist or is deactivated!");
  
    //Verify that ending a non-existent GC reverts
    await expect(GC_Manager.end_GC(bytes32("2026-2027"))).to.be.revertedWith("Championship doesn't exist or is deactivated!");
  
  });
  
  it("GC activation state after creation", async () => {
    const [owner] = await ethers.getSigners();
    const GC_Manager = await ethers.deployContract("GC_Manager");
    await GC_Manager.create_GC(bytes32("2025-2026"));
    const gcAddress = await GC_Manager.retrieve_GC(bytes32("2025-2026"));
    const GC = await ethers.getContractAt("GC", gcAddress);

    // Verify that the GC is active after creation
    expect(await GC.is_active()).to.equal(true);
    
  });
  
  it("Multiple GCs", async () => {
    const [owner] = await ethers.getSigners();
    const GC_Manager = await ethers.deployContract("GC_Manager");
    await GC_Manager.create_GC(bytes32("2024-2025"));
    await GC_Manager.create_GC(bytes32("2025-2026"));
    const gc1 = await GC_Manager.retrieve_GC(bytes32("2024-2025"));
    const gc2 = await GC_Manager.retrieve_GC(bytes32("2025-2026"));
    const GC1 = await ethers.getContractAt("GC", gc1);
    const GC2 = await ethers.getContractAt("GC", gc2);
    
    // Verify that GC1 is active
    expect(await GC1.is_active()).to.equal(true);
    
    
    // Verify that GC2 is active
    expect(await GC2.is_active()).to.equal(true);
    
    await GC_Manager.end_GC(bytes32("2024-2025"));
    
    // Verify that GC1 is inactive after ending
    expect(await GC1.is_active()).to.equal(false);
    
    
    // Verify that GC2 remains active
    expect(await GC2.is_active()).to.equal(true);
    
  });

  it("GC address retrieval", async () => {
    const [owner] = await ethers.getSigners();
    const GC_Manager = await ethers.deployContract("GC_Manager");
    await GC_Manager.create_GC(bytes32("2025-2026"));
    const gcAddress = await GC_Manager.retrieve_GC(bytes32("2025-2026"));

    // Verify that the GC address is valid
    expect(gcAddress).to.not.equal(ethers.ZeroAddress);
    
    const nonExistent = await GC_Manager.retrieve_GC(bytes32("2023-2024"));
    
    // Verify that retrieving a non-existent GC returns the zero address
    expect(nonExistent).to.equal(ethers.ZeroAddress);
    
  });
  
  // 3. Hostel Management Tests
  it("Add participant when GC is inactive", async () => {
    const [owner] = await ethers.getSigners();
    const GC_Manager = await ethers.deployContract("GC_Manager");
    await GC_Manager.create_GC(bytes32("2025-2026"));
    const gcAddress = await GC_Manager.retrieve_GC(bytes32("2025-2026"));
    const GC = await ethers.getContractAt("GC", gcAddress);
    await GC_Manager.end_GC(bytes32("2025-2026"));
    
    // Verify that adding a participant to an inactive GC reverts
    await expect(GC.add_Hostel(bytes32("Team"))).to.be.revertedWith("Championship doesn't exist or is deactivated!");
    
  });
  
  it("Add duplicate participant", async () => {
    const [owner] = await ethers.getSigners();
    const GC_Manager = await ethers.deployContract("GC_Manager");
    await GC_Manager.create_GC(bytes32("2025-2026"));
    const gcAddress = await GC_Manager.retrieve_GC(bytes32("2025-2026"));
    const GC = await ethers.getContractAt("GC", gcAddress);
    await GC.add_Hostel(bytes32("Team"));
    
    // Verify that adding a duplicate participant reverts
    await expect(GC.add_Hostel(bytes32("Team"))).to.be.revertedWith("Hostel already exists!");

  });
  
  it("Remove non-existent participant", async () => {
    const [owner] = await ethers.getSigners();
    const GC_Manager = await ethers.deployContract("GC_Manager");
    await GC_Manager.create_GC(bytes32("2025-2026"));
    const gcAddress = await GC_Manager.retrieve_GC(bytes32("2025-2026"));
    const GC = await ethers.getContractAt("GC", gcAddress);
    
    // Verify that removing a non-existent participant reverts
    await expect(GC.remove_Hostel(bytes32("NonExistent"))).to.be.revertedWith("Hostel doesn't exist!");
    
  });
  
  it("Hostel count accuracy", async () => {
    const [owner] = await ethers.getSigners();
    const GC_Manager = await ethers.deployContract("GC_Manager");
    await GC_Manager.create_GC(bytes32("2025-2026"));
    const gcAddress = await GC_Manager.retrieve_GC(bytes32("2025-2026"));
    const GC = await ethers.getContractAt("GC", gcAddress);
    
    // Verify initial participant count is 0
    expect(await GC.participant_count()).to.equal(0);
    
    await GC.add_Hostel(bytes32("Team1"));
    
    // Verify participant count is 1 after adding Team1
    expect(await GC.participant_count()).to.equal(1);
    
    await GC.add_Hostel(bytes32("Team2"));
    
    // Verify participant count is 2 after adding Team2
    expect(await GC.participant_count()).to.equal(2);
    
    await GC.remove_Hostel(bytes32("Team1"));
    
    // Verify participant count is 1 after removing Team1
    expect(await GC.participant_count()).to.equal(1);
    
  });

  it("Verify participant exists", async () => {
    const [owner, nonAdmin] = await ethers.getSigners();
    const GC_Manager = await ethers.deployContract("GC_Manager");
    await GC_Manager.create_GC(bytes32("2025-2026"));
    const gcAddress = await GC_Manager.retrieve_GC(bytes32("2025-2026"));
    const GC = await ethers.getContractAt("GC", gcAddress);
    await GC.add_Hostel(bytes32("Team"));
    // Authorized call
    
    // Verify that the participant exists
    expect(await GC["verify(bytes32)"](bytes32("Team"))).to.equal(true);
    
    // Non-existent
    
    // Verify that checking a non-existent participant reverts
    await expect(GC["verify(bytes32)"](bytes32("NonTeam"))).to.be.revertedWith("Hostel doesn't exist!");
    
    // Unauthorized caller
    
    // Verify that an unauthorized caller cannot verify a participant
    await expect(GC.connect(nonAdmin)["verify(bytes32)"](bytes32("Team"))).to.be.revertedWith("Unauthorised Action!");
    
  });

  // 4. Score Management Tests
  it("Set score for non-existent participant", async () => {
    const [owner] = await ethers.getSigners();
    const GC_Manager = await ethers.deployContract("GC_Manager");
    await GC_Manager.create_GC(bytes32("2025-2026"));
    const gcAddress = await GC_Manager.retrieve_GC(bytes32("2025-2026"));
    const GC = await ethers.getContractAt("GC", gcAddress);

    // Verify that setting a score for a non-existent participant reverts
    await expect(GC.set_Score(Leg.Tech, bytes32("Contest"), bytes32("NonTeam"), 100)).to.be.revertedWith("Hostel doesn't exist!");
    
  });
  
  it("Set score when GC inactive", async () => {
    const [owner] = await ethers.getSigners();
    const GC_Manager = await ethers.deployContract("GC_Manager");
    await GC_Manager.create_GC(bytes32("2025-2026"));
    const gcAddress = await GC_Manager.retrieve_GC(bytes32("2025-2026"));
    const GC = await ethers.getContractAt("GC", gcAddress);
    await GC.add_Hostel(bytes32("Team"));
    await GC_Manager.end_GC(bytes32("2025-2026"));
    
    // Verify that setting a score when GC is inactive reverts
    await expect(GC.set_Score(Leg.Tech, bytes32("Contest"), bytes32("Team"), 100)).to.be.revertedWith("Championship doesn't exist or is deactivated!");
    
  });
  
  it("Retrieve scores", async () => {
    const [owner] = await ethers.getSigners();
    const GC_Manager = await ethers.deployContract("GC_Manager");
    await GC_Manager.create_GC(bytes32("2025-2026"));
    const gcAddress = await GC_Manager.retrieve_GC(bytes32("2025-2026"));
    const GC = await ethers.getContractAt("GC", gcAddress);
    await GC.add_Hostel(bytes32("Team"));
    await GC.set_Score(Leg.Tech, bytes32("Hackathon"), bytes32("Team"), 95);
    await GC.set_Score(Leg.Sports, bytes32("Cricket"), bytes32("Team"), 80);
    
    // Verify the score for Hackathon
    expect(await GC.Scores(Leg.Tech, bytes32("Hackathon"), bytes32("Team"))).to.equal(95);
    
    
    // Verify the score for Cricket
    expect(await GC.Scores(Leg.Sports, bytes32("Cricket"), bytes32("Team"))).to.equal(80);
    
    
    // Verify the default score for Debate
    expect(await GC.Scores(Leg.Cult, bytes32("Debate"), bytes32("Team"))).to.equal(0); // Default
    
  });

  it("Score updates", async () => {
    const [owner] = await ethers.getSigners();
    const GC_Manager = await ethers.deployContract("GC_Manager");
    await GC_Manager.create_GC(bytes32("2025-2026"));
    const gcAddress = await GC_Manager.retrieve_GC(bytes32("2025-2026"));
    const GC = await ethers.getContractAt("GC", gcAddress);
    await GC.add_Hostel(bytes32("Team"));
    await GC.set_Score(Leg.Tech, bytes32("Contest"), bytes32("Team"), 50);
    
    // Verify the initial score
    expect(await GC.Scores(Leg.Tech, bytes32("Contest"), bytes32("Team"))).to.equal(50);
    
    await GC.set_Score(Leg.Tech, bytes32("Contest"), bytes32("Team"), 75);
    
    // Verify the updated score
    expect(await GC.Scores(Leg.Tech, bytes32("Contest"), bytes32("Team"))).to.equal(75);
    
  });
  
  it("Multiple scores per leg/contest", async () => {
    const [owner] = await ethers.getSigners();
    const GC_Manager = await ethers.deployContract("GC_Manager");
    await GC_Manager.create_GC(bytes32("2025-2026"));
    const gcAddress = await GC_Manager.retrieve_GC(bytes32("2025-2026"));
    const GC = await ethers.getContractAt("GC", gcAddress);
    await GC.add_Hostel(bytes32("Team1"));
    await GC.add_Hostel(bytes32("Team2"));
    await GC.set_Score(Leg.Tech, bytes32("Hackathon"), bytes32("Team1"), 90);
    await GC.set_Score(Leg.Tech, bytes32("Hackathon"), bytes32("Team2"), 85);
    
    // Verify the score for Team1
    expect(await GC.Scores(Leg.Tech, bytes32("Hackathon"), bytes32("Team1"))).to.equal(90);
    
    
    // Verify the score for Team2
    expect(await GC.Scores(Leg.Tech, bytes32("Hackathon"), bytes32("Team2"))).to.equal(85);
    
  });
  
  
    it("Edge Cases", async () => {
      const [owner, admin1, nonAdmin] = await ethers.getSigners();
  
      const GC_Manager = await ethers.deployContract("GC_Manager");
      await GC_Manager.add_admin_rights(admin1.address);
  
      await GC_Manager.create_GC(bytes32("2025-2026"));
      const gcAddress = await GC_Manager.retrieve_GC(bytes32("2025-2026"));
      const GC = await ethers.getContractAt("GC", gcAddress);
  
      // Non-admin cannot set score
  
      // Verify that setting a score for a non-existent participant reverts
      await expect(GC.connect(admin1).set_Score(Leg.Sports, bytes32("Cricket"), bytes32("Ganga"), 100)).to.be.revertedWith("Hostel doesn't exist!");
  
  
      // Non-admin cannot add participant
  
      // Verify that a non-admin cannot add a participant
      await expect(GC.connect(nonAdmin).add_Hostel(bytes32("Ganga"))).to.be.revertedWith("Unauthorised Action!");
  
  
      // Non-admin cannot deactivate GC
  
      // Verify that a non-admin cannot deactivate the GC
      await expect(GC.connect(nonAdmin).deactivate()).to.be.revertedWith("Unauthorised Action!");
  
    });
  
});