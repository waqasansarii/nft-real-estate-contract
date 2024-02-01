const { expect } = require("chai");
const { ethers } = require("hardhat");

const tokens = (n) => {
  return ethers.parseUnits(n.toString(), "ether");
};

describe("", () => {
  let real, escrow, deployer, seller, buyer, transaction,escrowAddress;
  let nftID = 1;
  let purchasePrice = tokens(100);
  let escrowAmount = tokens(20);
  let lender;
  let inspector;

  beforeEach(async () => {
    let accounts = await ethers.getSigners();
    deployer = accounts[0];
    seller = deployer;
    buyer = accounts[1];
    lender = accounts[2];
    inspector = accounts[3];
    // load contract
    const realEstate = await ethers.getContractFactory("RealEstate");
    const escrowContract = await ethers.getContractFactory("Escrow");

    // deploy contract
    real = await realEstate.deploy();
    escrowAddress = await real.getAddress();
    escrow = await escrowContract.deploy(
        escrowAddress,
      nftID,
      purchasePrice,
      escrowAmount,
      seller.address,
      buyer.address,
      lender.address,
      inspector.address
    );
    const addreasOfEscrow = await escrow.getAddress();

    // seller approve nft
    transaction = await real.connect(seller).approve(addreasOfEscrow, nftID);
    await transaction.wait();
  });

  describe("deployment", () => {
    it("send the nft to the seller", async () => {
      expect(await real.ownerOf(nftID)).to.equal(seller.address);
    });
  });

  describe("tranfering ownership", () => {
    let balance, transaction;
    it("execute tranfer function", async () => {
      //   checking escrow balance
      balance = await escrow.getBalance();
      console.log(ethers.formatEther(balance));

      // update inspection
      transaction = await escrow.connect(inspector).updateInspections(true);
      await transaction.wait();
      console.log("inspection passed!");

      // buyer deposit earnest
      transaction = await escrow
        .connect(buyer)
        .depositEarnest({ value: escrowAmount });
      await transaction.wait();
      console.log("buyer deposited earnest money");

    //   lender is sending funds to contract address 
     let escrowAdd = await escrow.getAddress()
      transaction = await lender.sendTransaction({to: escrowAdd , value:tokens(80)})
      await transaction.wait()
      console.log('funds transfered')

      //   buyer approve sale
      transaction = await escrow.connect(buyer).approvelSale();
      await transaction.wait();
      console.log("buyer approved sale");

      //   seller approve sale
      transaction = await escrow.connect(seller).approvelSale();
      await transaction.wait();
      console.log("seller approved sale");

      //   inspector approve sale
      transaction = await escrow.connect(inspector).approvelSale();
      await transaction.wait();
      console.log("inspector approved sale");

      //   lender approve sale
      transaction = await escrow.connect(lender).approvelSale();
      await transaction.wait();
      console.log("lender approved sale");

      //   checking new owner before sale of the nft
      expect(await real.ownerOf(nftID)).to.equal(seller.address);

      //   now sending to buyer
      transaction = await escrow.connect(buyer).finalizeSale();
      await transaction.wait();
      console.log("buyer finalize sale");
      //   checking new owner after sale of the nft
      expect(await real.ownerOf(nftID)).to.equal(buyer);

    //   check seller balance 
    balance =await ethers.provider.getBalance(seller.address)
    console.log('seller balance', ethers.formatEther(balance))

    });
  });
});
