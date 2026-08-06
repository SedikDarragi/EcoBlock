// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract EnergyMarket {
    struct Listing {
        uint256 id;
        address seller;
        uint256 amount;
        uint256 pricePerUnit;
        string energyType;
        string location;
        uint256 timestamp;
    }

    Listing[] public listings;
    uint256 public listingCounter;

    event ListingCreated(
        uint256 indexed id,
        address indexed seller,
        uint256 amount,
        uint256 pricePerUnit,
        string energyType,
        string location,
        uint256 timestamp
    );

    event EnergyPurchased(
        uint256 indexed id,
        address indexed buyer,
        address indexed seller,
        uint256 amount,
        uint256 cost,
        uint256 timestamp
    );

    function listEnergy(
        uint256 amount,
        uint256 pricePerUnit,
        string memory energyType,
        string memory location
    ) external {
        require(amount > 0, "EnergyMarket: amount must be greater than zero");
        require(pricePerUnit > 0, "EnergyMarket: price must be greater than zero");
        require(bytes(energyType).length > 0, "EnergyMarket: energy type required");
        require(bytes(location).length > 0, "EnergyMarket: location required");

        uint256 id = listingCounter++;
        listings.push(Listing({
            id: id,
            seller: msg.sender,
            amount: amount,
            pricePerUnit: pricePerUnit,
            energyType: energyType,
            location: location,
            timestamp: block.timestamp
        }));

        emit ListingCreated(id, msg.sender, amount, pricePerUnit, energyType, location, block.timestamp);
    }

    function buyEnergy(uint256 listingId, uint256 amount) external payable {
        require(listingId < listings.length, "EnergyMarket: listing does not exist");
        require(amount > 0, "EnergyMarket: amount must be greater than zero");

        Listing storage listing = listings[listingId];
        require(listing.amount >= amount, "EnergyMarket: insufficient energy available");
        require(listing.seller != msg.sender, "EnergyMarket: cannot buy your own listing");

        uint256 cost = amount * listing.pricePerUnit;
        require(msg.value >= cost, "EnergyMarket: insufficient payment");

        listing.amount -= amount;

        if (listing.amount == 0) {
            uint256 lastIndex = listings.length - 1;
            if (listingId != lastIndex) {
                listings[listingId] = listings[lastIndex];
            }
            listings.pop();
        }

        (bool success, ) = payable(listing.seller).call{ value: cost }("");
        require(success, "EnergyMarket: payment to seller failed");

        if (msg.value > cost) {
            (bool refundSuccess, ) = payable(msg.sender).call{ value: msg.value - cost }("");
            require(refundSuccess, "EnergyMarket: refund failed");
        }

        emit EnergyPurchased(listingId, msg.sender, listing.seller, amount, cost, block.timestamp);
    }

    function getAllListings() external view returns (Listing[] memory) {
        return listings;
    }
}
