// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity 0.8.24;

import "hardhat/console.sol";

contract FlickFrenzy {
    //Gasoptimering 1
    // Att använda enums för att definiera statusen på en Frenzy är mer gas effektivt än att använda en sträng.
    // eftersom den endast lagara en integer istället för en hel sträng.
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
    //Gasoptimering 2
    // att använda uint8 för att lagra frenzyId till en början är mer gas effektivt än att använda uint256.
    // om väldigt många frenzies skapas kan det vara en bra idé att använda uint256 istället.
    // Jag har även valt att änvända en fixed size array istället för en dynamisk för att lagra options.
    // Eftersom jag vet att det inte kommer vara mer än 3 options.

    struct ActiveFrenzy{
        uint8 frenzyId;
        string frenzyName;
        string[3] options;
    }

    mapping(uint => Frenzy) public frenzies;
    uint[] internal activeFrenzies;
    uint public frenzyCount;

    constructor() {
        activeFrenzies = new uint[](0);
    }

    event NewFrenzyStarted(string frenzyName, string message);
    event FrenzyCompleted(string frenzyName, string[3] frenzyOptions, string winner);

    fallback() external {
        revert("Function does not exist or was called incorrectly.");
    }

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

        return frenzy.frenzyId;
    }

    function startFrenzy(uint _frenzyId, uint _duration) public setStatus(_frenzyId, Status.Inactive){
        Frenzy storage frenzy = frenzies[_frenzyId];

        require(frenzy.creator == msg.sender, "Only the creator can start the frenzy");
        if (frenzy.status != Status.Inactive) {
            revert FrenzyNotInactive("Frenzy is not inactive, cannot start.");
        }

        frenzy.duration = _duration;
        frenzy.startTime = block.timestamp;
        frenzy.status = Status.Active;

        activeFrenzies.push(_frenzyId);

        emit NewFrenzyStarted(frenzy.frenzyName, "A new Frenzy has started");
    }

    function getFrenzies() public view returns (ActiveFrenzy[] memory) {

        uint _activeFrenzyCount = activeFrenzies.length;
        ActiveFrenzy[] memory _activeFrenzies = new ActiveFrenzy[](_activeFrenzyCount);

        require(_activeFrenzyCount > 0, "No active Frenzies");

        for (uint i = 0; i < _activeFrenzyCount; i++) {
            _activeFrenzies[i] = ActiveFrenzy({
                frenzyId: frenzies[activeFrenzies[i]].frenzyId,
                frenzyName: frenzies[activeFrenzies[i]].frenzyName,
                options: frenzies[activeFrenzies[i]].options
            });
        }

        return _activeFrenzies;
    }
    
    //Gasoptimering 3 
    // Genom att låta folk rösta på en Frenzy genom att skicka in en uint8 istället för en sträng är mer gas effektivt.
    // Eftersom det är billigare att skicka in en uint8 än en sträng.
    // Det är även billigare att jämföra en uint8 än en sträng där vi behöver använda oss av keccak256 för att jämföra strängar.
    // Vi eliminerar även risken för eventuella felstavningar eller liknande genom att använda integers istället för strängar.
    function vote(uint _frenzyId, uint _options) public {
        Frenzy storage frenzy = frenzies[_frenzyId];

        require(frenzies[_frenzyId].status == Status.Active, "Frenzy is not active.");
        require(_options < 3, "Invalid option, must be 0, 1, or 2.");
        require(frenzies[_frenzyId].hasVoted[msg.sender] == false, "You can only vote one time per Frenzy.");
        
        frenzy.votes[_options]++;
        frenzy.hasVoted[msg.sender] = true;
    }

    function checkFrenzy(uint _frenzyId) public {
        Frenzy storage frenzy = frenzies[_frenzyId];

        require(frenzy.status == Status.Active, "Frenzy is not active.");
        require(block.timestamp >= frenzy.startTime + frenzy.duration, "Frenzy is still active.");

        uint _voteCount = frenzy.votes[0];
        uint _winner = 0;

        for (uint i = 1; i < 3; i++) {
            if (frenzy.votes[i] > _voteCount) {
                _voteCount = frenzy.votes[i];
                _winner = i;
            }
        }
        frenzy.status = Status.Completed;

        for (uint i = 0; i < activeFrenzies.length; i++) {
            if (activeFrenzies[i] == _frenzyId) {
                activeFrenzies[i] = activeFrenzies[activeFrenzies.length - 1];
                activeFrenzies.pop();
                break;
            }
        }

        assert(frenzy.status == Status.Completed);

        emit FrenzyCompleted(frenzy.frenzyName, frenzy.options, frenzy.options[_winner]);
    }

    receive() external payable {
        revert("Contract does not accept Ether.");
    }

    function getFrenzyOptions(uint _frenzyId) public view returns (string[3] memory) {
        return frenzies[_frenzyId].options;
    }
}