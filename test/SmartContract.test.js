const SmartContract = artifacts.require("SmartContract");

contract("SmartContract", (accounts) => {
  const [owner, voter1, voter2] = accounts;
  let instance;

  beforeEach(async () => {
    instance = await SmartContract.new({ from: owner });
  });

  it("deploys with 2 default candidates", async () => {
    assert.equal((await instance.candidatesCount()).toString(), "2");
    assert.equal(await instance.owner(), owner);
  });

  it("lets an account vote once", async () => {
    await instance.vote(1, { from: voter1 });
    const c = await instance.candidates(1);
    assert.equal(c.voteCount.toString(), "1");
    assert.equal(await instance.hasVoted(voter1), true);
  });

  it("rejects a second vote from the same account", async () => {
    await instance.vote(1, { from: voter1 });
    try {
      await instance.vote(2, { from: voter1 });
      assert.fail("should have reverted");
    } catch (e) {
      assert.include(e.message, "Already voted");
    }
  });

  it("only owner can add candidates", async () => {
    await instance.addCandidate("Carol", { from: owner });
    assert.equal((await instance.candidatesCount()).toString(), "3");
    try {
      await instance.addCandidate("Dave", { from: voter2 });
      assert.fail("should have reverted");
    } catch (e) {
      assert.include(e.message, "Only owner");
    }
  });

  it("blocks votes when voting is closed", async () => {
    await instance.setVotingOpen(false, { from: owner });
    try {
      await instance.vote(1, { from: voter1 });
      assert.fail("should have reverted");
    } catch (e) {
      assert.include(e.message, "Voting is closed");
    }
  });
});
