// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;
import "./GC_Manager.sol";

enum Leg {
    Tech,
    Sports,
    Cult,
    Literature
}

contract GC {
    bytes32 Year;
    bool public is_active = false;
    address private GC_Manager_sol;
    mapping(bytes32 => bool) public Participants;
    uint8 public participant_count;
    mapping(Leg => mapping(bytes32 => mapping(bytes32 => uint))) public Scores;

    constructor(bytes32 cand) {
        Year = cand;
        is_active = true;
        GC_Manager_sol = (msg.sender);
        participant_count = 0;
    }

    function verify(bytes32 name) public view returns (bool) {
        if (is_active == false) revert("Championship doesn't exist or is deactivated!");
        if (Participants[name] == false) revert("Participant doesn't exist!");
        if (GC_Manager(GC_Manager_sol).verify_caller(msg.sender) == false)
            revert("Unauthorised Action!");
        return true;
    }
  
    function verify() public view returns (bool) {
        if (is_active == false) revert("Championship doesn't exist or is deactivated!");
        if (GC_Manager(GC_Manager_sol).verify_caller(msg.sender) == false)
            revert("Unauthorised Action!");
        return true;
    }

    function deactivate() public {
        verify();
        is_active = false;
    }

    function add_Participant(bytes32 name) public {
        verify();
        if (Participants[name] == true) revert("Participant already exists!");
        Participants[name] = true;
        participant_count += 1;
    }

    function remove_Participant(bytes32 name) public {
        verify(name);
        Participants[name] = false;
        participant_count -= 1;
    }

    function set_Score(
        Leg type_of_contest,
        bytes32 contest,
        bytes32 team,
        uint score
    ) public {
        verify(team);
        Scores[type_of_contest][contest][team] = score;
    }
}
