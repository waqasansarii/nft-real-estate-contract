//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.2;

interface IERC721 {
    function transferFrom(address _from, address _to, uint _id) external;
}

contract Escrow {
    address public nftAddress;
    uint256 public nftID;
    uint256 public purchasePrice;
    uint256 public escrowAmount;
    address payable buyer;
    address payable seller;
    address public lender;
    address public inspector;

    bool public inspectionPassed = false;
    mapping(address => bool) public approval;

    constructor(
        address _nftAddress,
        uint256 _nftID,
        uint256 _purchasePrice,
        uint256 _escrowAmount,
        address payable _seller,
        address payable _buyer,
        address _lender,
        address _inspector
    ) {
        nftAddress = _nftAddress;
        nftID = _nftID;
        seller = _seller;
        buyer = _buyer;
        purchasePrice = _purchasePrice;
        escrowAmount = _escrowAmount;
        lender = _lender;
        inspector = _inspector;
    }

    modifier onlyBuyer() {
        require(msg.sender == buyer, "only buyer can deposit");
        _;
    }
    modifier onlyInspector() {
        require(msg.sender == inspector, "only inspector can deposit");
        _;
    }

    function updateInspections(bool _passed) public onlyInspector {
        inspectionPassed = _passed;
    }

    function depositEarnest() public payable onlyBuyer {
        require(msg.value >= escrowAmount);
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
        // return escrowAmount;
    }

    function approvelSale() public {
        approval[msg.sender] = true;
    }

     // Cancel Sale (handle earnest deposit)
    // -> if inspection status is not approved, then refund, otherwise send to seller
    function cancelSale() public {
        if(inspectionPassed == false) {
            payable(buyer).transfer(address(this).balance);
        } else {
            payable(seller).transfer(address(this).balance);
        }
    }

    receive() external payable {}

    function finalizeSale() public {
        require(inspectionPassed, "must pass inspection");
        require(approval[buyer], "must be approved by buyer");
        require(approval[seller], "must be approved by seller");
        require(approval[lender], "must be approved by lender");
        require(address(this).balance >= purchasePrice,"funds not enough");

    //    sending funds from smart contract to the seller 
        (bool success,) = payable(seller).call{value: address(this).balance }("");
        require(success);

    //    then transfering ownership of the nft from seller to the buyer 
        IERC721(nftAddress).transferFrom(seller, buyer, nftID);
    }

    // function checkBalance(address _address) public{
    //     address(_address).balance;
    // }
}
