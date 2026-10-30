const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

const State = { Setup: 0n, Active: 1n, Ended: 2n };

describe("VotingSystem", function () {
  async function deployFixture() {
    const [owner, alice, bob, carol, outsider] = await ethers.getSigners();
    const Voting = await ethers.getContractFactory("VotingSystem");
    const voting = await Voting.deploy("Student Council Election 2026");
    await voting.waitForDeployment();
    return { voting, owner, alice, bob, carol, outsider };
  }

  async function setupFixture() {
    const ctx = await deployFixture();
    const { voting, alice, bob, carol } = ctx;
    await voting.addCandidate("Aarav Sharma", "Progressive Students", "🌱", "Greener campus");
    await voting.addCandidate("Diya Patel", "Unity Front", "🤝", "Better hostels");
    await voting.addCandidate("Kabir Singh", "Tech Forward", "💡", "Faster Wi-Fi");
    await voting.registerVoters([alice.address, bob.address, carol.address]);
    return ctx;
  }

  async function activeFixture() {
    const ctx = await setupFixture();
    await ctx.voting.startElection();
    return ctx;
  }

  describe("Deployment", function () {
    it("sets owner, name and initial state", async function () {
      const { voting, owner } = await loadFixture(deployFixture);
      expect(await voting.owner()).to.equal(owner.address);
      expect(await voting.electionName()).to.equal("Student Council Election 2026");
      expect(await voting.state()).to.equal(State.Setup);
      expect(await voting.candidateCount()).to.equal(0n);
    });

    it("rejects an empty election name", async function () {
      const Voting = await ethers.getContractFactory("VotingSystem");
      await expect(Voting.deploy("")).to.be.revertedWithCustomError(Voting, "EmptyField");
    });
  });

  describe("Candidate registration", function () {
    it("lets the owner add candidates and emits CandidateAdded", async function () {
      const { voting } = await loadFixture(deployFixture);
      await expect(voting.addCandidate("Aarav", "Party A", "🌱", "desc"))
        .to.emit(voting, "CandidateAdded")
        .withArgs(0n, "Aarav", "Party A");

      const c = await voting.getCandidate(0);
      expect(c.id).to.equal(0n);
      expect(c.name).to.equal("Aarav");
      expect(c.party).to.equal("Party A");
      expect(c.symbol).to.equal("🌱");
      expect(c.description).to.equal("desc");
      expect(c.voteCount).to.equal(0n);
    });

    it("rejects non-owner candidate registration", async function () {
      const { voting, alice } = await loadFixture(deployFixture);
      await expect(
        voting.connect(alice).addCandidate("X", "Y", "Z", "")
      ).to.be.revertedWithCustomError(voting, "NotOwner");
    });

    it("validates required and over-long fields", async function () {
      const { voting } = await loadFixture(deployFixture);
      await expect(voting.addCandidate("", "P", "S", ""))
        .to.be.revertedWithCustomError(voting, "EmptyField")
        .withArgs("name");
      await expect(voting.addCandidate("N", "", "S", ""))
        .to.be.revertedWithCustomError(voting, "EmptyField")
        .withArgs("party");
      await expect(voting.addCandidate("N", "P", "", ""))
        .to.be.revertedWithCustomError(voting, "EmptyField")
        .withArgs("symbol");
      await expect(voting.addCandidate("N", "P", "S", "x".repeat(281)))
        .to.be.revertedWithCustomError(voting, "FieldTooLong")
        .withArgs("description");
    });

    it("enforces the candidate limit", async function () {
      const { voting } = await loadFixture(deployFixture);
      for (let i = 0; i < 50; i++) await voting.addCandidate(`C${i}`, "P", "S", "");
      await expect(voting.addCandidate("C50", "P", "S", "")).to.be.revertedWithCustomError(
        voting,
        "TooManyCandidates"
      );
    });

    it("blocks adding candidates after the election starts", async function () {
      const { voting } = await loadFixture(activeFixture);
      await expect(voting.addCandidate("Late", "P", "S", ""))
        .to.be.revertedWithCustomError(voting, "InvalidState")
        .withArgs(State.Setup, State.Active);
    });

    it("returns all candidates and reverts for unknown ids", async function () {
      const { voting } = await loadFixture(setupFixture);
      const all = await voting.getCandidates();
      expect(all.length).to.equal(3);
      expect(all[1].name).to.equal("Diya Patel");
      await expect(voting.getCandidate(3))
        .to.be.revertedWithCustomError(voting, "InvalidCandidate")
        .withArgs(3n);
    });
  });

  describe("Voter registration", function () {
    it("registers voters, skips duplicates and tracks the count", async function () {
      const { voting, alice, bob } = await loadFixture(deployFixture);
      await expect(voting.registerVoters([alice.address, bob.address, alice.address]))
        .to.emit(voting, "VoterRegistered")
        .withArgs(alice.address);
      expect(await voting.eligibleVoterCount()).to.equal(2n);
      expect(await voting.isEligibleVoter(alice.address)).to.equal(true);
    });

    it("rejects zero address, non-owner and oversized batches", async function () {
      const { voting, alice } = await loadFixture(deployFixture);
      await expect(voting.registerVoters([ethers.ZeroAddress])).to.be.revertedWithCustomError(
        voting,
        "ZeroAddress"
      );
      await expect(
        voting.connect(alice).registerVoters([alice.address])
      ).to.be.revertedWithCustomError(voting, "NotOwner");
      const big = Array.from({ length: 201 }, () => ethers.Wallet.createRandom().address);
      await expect(voting.registerVoters(big)).to.be.revertedWithCustomError(voting, "BatchTooLarge");
    });

    it("allows late registration while active but not after the end", async function () {
      const { voting, outsider } = await loadFixture(activeFixture);
      await voting.registerVoters([outsider.address]);
      expect(await voting.isEligibleVoter(outsider.address)).to.equal(true);
      await voting.endElection();
      await expect(voting.registerVoters([ethers.Wallet.createRandom().address])).to.be.revertedWithCustomError(
        voting,
        "InvalidState"
      );
    });

    it("removes voters only during setup", async function () {
      const { voting, alice, outsider } = await loadFixture(setupFixture);
      await expect(voting.removeVoter(alice.address)).to.emit(voting, "VoterRemoved").withArgs(alice.address);
      expect(await voting.eligibleVoterCount()).to.equal(2n);
      await expect(voting.removeVoter(outsider.address)).to.be.revertedWithCustomError(voting, "NotEligible");
      await voting.startElection();
      await expect(voting.removeVoter(ethers.ZeroAddress)).to.be.revertedWithCustomError(voting, "InvalidState");
    });
  });

  describe("Election lifecycle", function () {
    it("cannot start without candidates", async function () {
      const { voting } = await loadFixture(deployFixture);
      await expect(voting.startElection()).to.be.revertedWithCustomError(voting, "NoCandidates");
    });

    it("starts and ends with events and timestamps", async function () {
      const { voting } = await loadFixture(setupFixture);
      await expect(voting.startElection()).to.emit(voting, "ElectionStarted");
      expect(await voting.state()).to.equal(State.Active);
      expect(await voting.startedAt()).to.be.greaterThan(0n);

      await expect(voting.endElection()).to.emit(voting, "ElectionEnded");
      expect(await voting.state()).to.equal(State.Ended);
      expect(await voting.endedAt()).to.be.greaterThan(0n);
    });

    it("restricts start/end to the owner", async function () {
      const { voting, alice } = await loadFixture(setupFixture);
      await expect(voting.connect(alice).startElection()).to.be.revertedWithCustomError(voting, "NotOwner");
      await voting.startElection();
      await expect(voting.connect(alice).endElection()).to.be.revertedWithCustomError(voting, "NotOwner");
    });

    it("cannot end before start, restart, or start twice", async function () {
      const { voting } = await loadFixture(setupFixture);
      await expect(voting.endElection()).to.be.revertedWithCustomError(voting, "InvalidState");
      await voting.startElection();
      await expect(voting.startElection()).to.be.revertedWithCustomError(voting, "InvalidState");
      await voting.endElection();
      await expect(voting.startElection()).to.be.revertedWithCustomError(voting, "InvalidState");
      await expect(voting.endElection()).to.be.revertedWithCustomError(voting, "InvalidState");
    });
  });

  describe("Voting", function () {
    it("records a vote, updates counts and emits VoteCast", async function () {
      const { voting, alice } = await loadFixture(activeFixture);
      await expect(voting.connect(alice).vote(1))
        .to.emit(voting, "VoteCast")
        .withArgs(alice.address, 1n);
      expect((await voting.getCandidate(1)).voteCount).to.equal(1n);
      expect(await voting.totalVotes()).to.equal(1n);
      const [eligible, voted] = await voting.getVoterStatus(alice.address);
      expect(eligible).to.equal(true);
      expect(voted).to.equal(true);
    });

    it("prevents double voting", async function () {
      const { voting, alice } = await loadFixture(activeFixture);
      await voting.connect(alice).vote(0);
      await expect(voting.connect(alice).vote(1))
        .to.be.revertedWithCustomError(voting, "AlreadyVoted")
        .withArgs(alice.address);
    });

    it("rejects ineligible voters (including the owner when not registered)", async function () {
      const { voting, owner, outsider } = await loadFixture(activeFixture);
      await expect(voting.connect(outsider).vote(0))
        .to.be.revertedWithCustomError(voting, "NotEligible")
        .withArgs(outsider.address);
      await expect(voting.connect(owner).vote(0)).to.be.revertedWithCustomError(voting, "NotEligible");
    });

    it("rejects invalid candidate ids", async function () {
      const { voting, alice } = await loadFixture(activeFixture);
      await expect(voting.connect(alice).vote(99))
        .to.be.revertedWithCustomError(voting, "InvalidCandidate")
        .withArgs(99n);
      // a failed vote must not consume the voter's ballot
      await voting.connect(alice).vote(2);
      expect((await voting.getCandidate(2)).voteCount).to.equal(1n);
    });

    it("rejects votes before the election starts", async function () {
      const { voting, alice } = await loadFixture(setupFixture);
      await expect(voting.connect(alice).vote(0))
        .to.be.revertedWithCustomError(voting, "InvalidState")
        .withArgs(State.Active, State.Setup);
    });

    it("rejects votes after the election ends", async function () {
      const { voting, alice } = await loadFixture(activeFixture);
      await voting.endElection();
      await expect(voting.connect(alice).vote(0))
        .to.be.revertedWithCustomError(voting, "InvalidState")
        .withArgs(State.Active, State.Ended);
    });
  });

  describe("Results", function () {
    it("tallies votes and reports the leader", async function () {
      const { voting, alice, bob, carol } = await loadFixture(activeFixture);
      await voting.connect(alice).vote(2);
      await voting.connect(bob).vote(2);
      await voting.connect(carol).vote(0);

      const all = await voting.getCandidates();
      expect(all.map((c) => c.voteCount)).to.deep.equal([1n, 0n, 2n]);

      const [leaders, top] = await voting.getLeaders();
      expect(leaders).to.deep.equal([2n]);
      expect(top).to.equal(2n);

      const info = await voting.getElectionInfo();
      expect(info.votes).to.equal(3n);
      expect(info.eligibleVoters).to.equal(3n);
      expect(info.candidates).to.equal(3n);
    });

    it("reports ties and an empty leader list with no votes", async function () {
      const { voting, alice, bob } = await loadFixture(activeFixture);
      let [leaders, top] = await voting.getLeaders();
      expect(leaders).to.deep.equal([]);
      expect(top).to.equal(0n);

      await voting.connect(alice).vote(0);
      await voting.connect(bob).vote(1);
      [leaders, top] = await voting.getLeaders();
      expect(leaders).to.deep.equal([0n, 1n]);
      expect(top).to.equal(1n);
    });

    it("is readable by anyone", async function () {
      const { voting, outsider } = await loadFixture(activeFixture);
      const asOutsider = voting.connect(outsider);
      expect((await asOutsider.getCandidates()).length).to.equal(3);
      expect(await asOutsider.totalVotes()).to.equal(0n);
    });
  });

  describe("Ownership", function () {
    it("transfers ownership and restricts it to the owner", async function () {
      const { voting, owner, alice } = await loadFixture(deployFixture);
      await expect(voting.connect(alice).transferOwnership(alice.address)).to.be.revertedWithCustomError(
        voting,
        "NotOwner"
      );
      await expect(voting.transferOwnership(ethers.ZeroAddress)).to.be.revertedWithCustomError(
        voting,
        "ZeroAddress"
      );
      await expect(voting.transferOwnership(alice.address))
        .to.emit(voting, "OwnershipTransferred")
        .withArgs(owner.address, alice.address);
      expect(await voting.owner()).to.equal(alice.address);
      await expect(voting.addCandidate("N", "P", "S", "")).to.be.revertedWithCustomError(voting, "NotOwner");
    });
  });
});
