// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity 0.8.24;

contract FlickFrenzy {
    enum Status { Inactive, Active, Completed }

    struct Frenzy {
        address creator;
        uint8 frenzyId;
        string frenzyName;
        string[3] options;
        uint duration;
        uint startTime;
        uint[3] votes;
        mapping(address => bool) hasVoted;
        Status status;
    }

    mapping(uint => Frenzy) public frenzies;
    uint[] public activeFrenzies;
    uint public frenzyCount;

    constructor() {
        activeFrenzies = new uint[](0);
    }

    event NewFrenzyStarted(string frenzyName, string message);

    error FrenzyNotInactive(string message);

    modifier setStatus(uint _frenzyId, Status _status) {
        require(frenzies[_frenzyId].status == _status, "Frenzy is not in the required status.");
        _;
    }

    function createFrenzy(string memory _frenzyName, string[3] memory _options) public returns (uint) {
        for (uint i = 1; i <= frenzyCount; i++) {
            require(keccak256(bytes(frenzies[i].frenzyName)) != keccak256(bytes(_frenzyName)), "Frenzy name already exists");
        } 
        frenzyCount++;

        Frenzy storage frenzy = frenzies[frenzyCount];
        frenzy.creator = msg.sender;
        frenzy.frenzyId = uint8(frenzyCount);
        frenzy.frenzyName = _frenzyName;
        frenzy.options = _options;
        frenzy.status = Status.Inactive;

        return (frenzy.frenzyId);
    }

    function startFrenzy(uint _frenzyId, uint _duration) public setStatus(_frenzyId, Status.Inactive){
        Frenzy storage frenzy = frenzies[_frenzyId];

        require(frenzy.creator == msg.sender, "Only the creator can start the frenzy");
        if (frenzy.status != Status.Inactive) {
            revert FrenzyNotInactive("Frenzy is not Inactive.");
        }

        frenzy.duration = _duration;
        frenzy.startTime = block.timestamp;
        frenzy.status = Status.Active;

        activeFrenzies.push(_frenzyId);

        emit NewFrenzyStarted(frenzy.frenzyName, "A new Frenzy has started");
    }

    function vote(uint _frenzyId, uint _options) public {
        Frenzy storage frenzy = frenzies[_frenzyId];

        require(frenzies[_frenzyId].status == Status.Active, "Frenzy is not active.");
        require(_options < 3, "Invalid option, must be 0, 1, or 2.");
        require(frenzies[_frenzyId].hasVoted[msg.sender] == false, "You can only vote one time per Frenzy.");
        
        frenzy.votes[_options]++;
        frenzy.hasVoted[msg.sender] = true;
    }
}