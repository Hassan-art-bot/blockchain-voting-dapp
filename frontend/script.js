// Ballot Box dApp - talks to the Truffle-deployed SmartContract via web3.js.
// Works with Ganache directly (no MetaMask needed). If MetaMask is present it is used instead.

let web3;
let contract;
let accounts = [];
let ownerAddress = "";

const $ = (id) => document.getElementById(id);

function say(text, isError = false) {
  const el = $("message");
  el.textContent = text;
  el.className = "message" + (isError ? " error" : "");
}

function logEvent(text) {
  const li = document.createElement("li");
  li.textContent = text;
  $("events").prepend(li);
}

function short(a) { return a.slice(0, 6) + "..." + a.slice(-4); }

async function init() {
  try {
    if (window.ethereum) {
      web3 = new Web3(window.ethereum);
      await window.ethereum.request({ method: "eth_requestAccounts" });
    } else {
      web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:7545"));
    }

    accounts = await web3.eth.getAccounts();
    const networkId = await web3.eth.net.getId();

    const artifact = await (await fetch("SmartContract.json")).json();
    const deployed = artifact.networks[networkId];
    if (!deployed) {
      say("Contract not deployed on network " + networkId + ". Run: truffle migrate --reset", true);
      return;
    }

    contract = new web3.eth.Contract(artifact.abi, deployed.address);
    $("contractAddr").textContent = deployed.address;

    const select = $("accountSelect");
    select.innerHTML = "";
    accounts.forEach((a, i) => {
      const o = document.createElement("option");
      o.value = a;
      o.textContent = (i === 0 ? "Account 1 (owner) " : "Account " + (i + 1) + " ") + short(a);
      select.appendChild(o);
    });
    select.addEventListener("change", refresh);

    $("addBtn").addEventListener("click", addCandidate);
    $("toggleBtn").addEventListener("click", toggleVoting);

    await refresh();
    say("Connected. Pick an account and cast a vote.");
  } catch (err) {
    console.error(err);
    say("Could not connect. Is Ganache running on port 7545 and have you run truffle migrate?", true);
  }
}

async function refresh() {
  const current = $("accountSelect").value;
  ownerAddress = await contract.methods.owner().call();
  const open = await contract.methods.votingOpen().call();
  const count = Number(await contract.methods.candidatesCount().call());
  const voted = await contract.methods.hasVoted(current).call();

  $("ownerAddr").textContent = ownerAddress;
  $("status").textContent = open ? "Open" : "Closed";
  $("toggleBtn").textContent = open ? "Close voting" : "Reopen voting";

  const isOwner = current.toLowerCase() === ownerAddress.toLowerCase();
  $("addBtn").disabled = !isOwner;
  $("toggleBtn").disabled = !isOwner;
  $("adminHint").textContent = isOwner ? "You are the owner." : "Switch to the owner account (first Ganache account) to use these.";

  const list = $("candidateList");
  list.innerHTML = "";
  $("emptyMsg").hidden = count > 0;

  const rows = [];
  let total = 0;
  for (let i = 1; i <= count; i++) {
    const c = await contract.methods.candidates(i).call();
    rows.push(c);
    total += Number(c.voteCount);
  }

  rows.forEach((c) => {
    const pct = total ? (Number(c.voteCount) / total) * 100 : 0;
    const li = document.createElement("li");
    li.className = "cand";

    const name = document.createElement("span");
    name.className = "name";
    name.textContent = c.name;

    const right = document.createElement("span");
    right.className = "count";
    right.textContent = c.voteCount + (Number(c.voteCount) === 1 ? " vote " : " votes ");

    const btn = document.createElement("button");
    btn.textContent = "Vote for " + c.name;
    btn.disabled = !open || voted;
    btn.addEventListener("click", () => vote(c.id));
    right.appendChild(btn);

    const track = document.createElement("div");
    track.className = "track";
    const fill = document.createElement("div");
    fill.className = "fill";
    fill.style.width = pct + "%";
    track.appendChild(fill);

    li.append(name, right, track);
    list.appendChild(li);
  });

  if (voted) say("This account has already voted. Switch accounts to vote again.");
}

async function send(method, label) {
  const from = $("accountSelect").value;
  try {
    say(label + " - waiting for confirmation...");
    const receipt = await method.send({ from, gas: 300000 });
    logEvent(label + " | tx " + short(receipt.transactionHash) + " | block " + receipt.blockNumber);
    say(label + " confirmed.");
    await refresh();
  } catch (err) {
    const msg = (err.message || "").match(/revert (.*?)(\"|$)/);
    say(msg ? "Rejected: " + msg[1] : "Transaction failed: " + err.message, true);
  }
}

function vote(id) { return send(contract.methods.vote(id), "Vote"); }

function addCandidate() {
  const name = $("newCandidate").value.trim();
  if (!name) { say("Enter a candidate name first.", true); return; }
  $("newCandidate").value = "";
  return send(contract.methods.addCandidate(name), "Add candidate");
}

async function toggleVoting() {
  const open = await contract.methods.votingOpen().call();
  return send(contract.methods.setVotingOpen(!open), open ? "Close voting" : "Reopen voting");
}

window.addEventListener("load", init);
