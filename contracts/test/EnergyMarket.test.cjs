const { expect } = require("chai");
const { ethers } = require("hardhat");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

describe("EnergyMarket", function () {
  let energyMarket;
  let owner;
  let seller;
  let buyer;

  beforeEach(async function () {
    [owner, seller, buyer] = await ethers.getSigners();
    const EnergyMarket = await ethers.getContractFactory("EnergyMarket");
    energyMarket = await EnergyMarket.deploy();
    await energyMarket.waitForDeployment();
  });

  const WEI_PER_UNIT = ethers.parseEther("1");

  async function listListing(from, amount = 5, price = "0.1", type = "solar", location = "Berlin") {
    const tx = await energyMarket.connect(from).listEnergy(
      ethers.parseEther(amount.toString()),
      ethers.parseEther(price.toString()),
      type,
      location
    );
    await tx.wait();
  }

  describe("listEnergy", function () {
    it("creates a listing with the seller, amount and timestamp", async function () {
      await listListing(seller);

      const listings = await energyMarket.getAllListings();
      expect(listings.length).to.equal(1);

      const listing = listings[0];
      expect(listing.seller).to.equal(seller.address);
      expect(listing.amount).to.equal(ethers.parseEther("5"));
      expect(listing.pricePerUnit).to.equal(ethers.parseEther("0.1"));
      expect(listing.energyType).to.equal("solar");
      expect(listing.location).to.equal("Berlin");
      expect(listing.timestamp).to.be.gt(0);
    });

    it("emits a ListingCreated event", async function () {
      await expect(
        energyMarket.connect(seller).listEnergy(
          ethers.parseEther("5"),
          ethers.parseEther("0.1"),
          "solar",
          "Berlin"
        )
      )
        .to.emit(energyMarket, "ListingCreated")
        .withArgs(0, seller.address, ethers.parseEther("5"), ethers.parseEther("0.1"), "solar", "Berlin", anyValue);
    });

    it("rejects zero amount", async function () {
      await expect(
        energyMarket.connect(seller).listEnergy(0, WEI_PER_UNIT, "solar", "Berlin")
      ).to.be.revertedWith("EnergyMarket: amount must be greater than zero");
    });

    it("rejects zero price", async function () {
      await expect(
        energyMarket.connect(seller).listEnergy(ethers.parseEther("5"), 0, "solar", "Berlin")
      ).to.be.revertedWith("EnergyMarket: price must be greater than zero");
    });

    it("rejects empty energy type", async function () {
      await expect(
        energyMarket.connect(seller).listEnergy(ethers.parseEther("5"), WEI_PER_UNIT, "", "Berlin")
      ).to.be.revertedWith("EnergyMarket: energy type required");
    });

    it("rejects empty location", async function () {
      await expect(
        energyMarket.connect(seller).listEnergy(ethers.parseEther("5"), WEI_PER_UNIT, "solar", "")
      ).to.be.revertedWith("EnergyMarket: location required");
    });
  });

  describe("buyEnergy", function () {
    beforeEach(async function () {
      await listListing(seller, 5, "0.1");
    });

    it("transfers payment to the seller and reduces the listing amount", async function () {
      const cost = ethers.parseEther("0.3"); // 3 units * 0.1

      await expect(
        energyMarket.connect(buyer).buyEnergy(0, ethers.parseEther("3"), { value: cost })
      ).to.changeEtherBalances([seller], [cost]);

      const listing = (await energyMarket.getAllListings())[0];
      expect(listing.amount).to.equal(ethers.parseEther("2"));
    });

    it("emits an EnergyPurchased event", async function () {
      const cost = ethers.parseEther("0.3");
      await expect(
        energyMarket.connect(buyer).buyEnergy(0, ethers.parseEther("3"), { value: cost })
      )
        .to.emit(energyMarket, "EnergyPurchased")
        .withArgs(0, buyer.address, seller.address, ethers.parseEther("3"), cost, anyValue);
    });

    it("refunds excess payment", async function () {
      const before = await ethers.provider.getBalance(buyer.address);
      const cost = ethers.parseEther("0.3");
      const paid = ethers.parseEther("1");

      const tx = await energyMarket.connect(buyer).buyEnergy(0, ethers.parseEther("3"), { value: paid });
      const receipt = await tx.wait();

      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      const after = await ethers.provider.getBalance(buyer.address);
      const spent = before - after;
      // paid minus refund (paid - cost) minus gas
      expect(spent).to.equal(cost + gasUsed);
    });

    it("removes a listing once fully purchased", async function () {
      const cost = ethers.parseEther("0.5");
      await energyMarket.connect(buyer).buyEnergy(0, ethers.parseEther("5"), { value: cost });
      const listings = await energyMarket.getAllListings();
      expect(listings.length).to.equal(0);
    });

    it("reverts when buying more than available", async function () {
      await expect(
        energyMarket.connect(buyer).buyEnergy(0, ethers.parseEther("6"), { value: ethers.parseEther("0.6") })
      ).to.be.revertedWith("EnergyMarket: insufficient energy available");
    });

    it("reverts when payment is insufficient", async function () {
      await expect(
        energyMarket.connect(buyer).buyEnergy(0, ethers.parseEther("3"), { value: ethers.parseEther("0.2") })
      ).to.be.revertedWith("EnergyMarket: insufficient payment");
    });

    it("reverts when buying your own listing", async function () {
      await expect(
        energyMarket.connect(seller).buyEnergy(0, ethers.parseEther("1"), { value: ethers.parseEther("0.1") })
      ).to.be.revertedWith("EnergyMarket: cannot buy your own listing");
    });

    it("reverts when the listing does not exist", async function () {
      await expect(
        energyMarket.connect(buyer).buyEnergy(42, ethers.parseEther("1"), { value: ethers.parseEther("0.1") })
      ).to.be.revertedWith("EnergyMarket: listing does not exist");
    });
  });

  describe("getAllListings", function () {
    it("returns an empty array when no listings exist", async function () {
      const listings = await energyMarket.getAllListings();
      expect(listings.length).to.equal(0);
    });

    it("returns multiple listings", async function () {
      await listListing(seller, 5, "0.1", "solar", "Berlin");
      await listListing(buyer, 3, "0.2", "wind", "Hamburg");
      const listings = await energyMarket.getAllListings();
      expect(listings.length).to.equal(2);
      expect(listings[1].seller).to.equal(buyer.address);
    });
  });
});
