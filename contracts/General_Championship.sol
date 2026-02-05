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
    mapping(bytes32 => bool) public Hostels;
    uint8 public participant_count;
    mapping(Leg => mapping(bytes32 => mapping(bytes32 => uint))) public Scores;

    event Contest_event(string event_name,bytes32 contest);
    event updateScore(string id);
    constructor(bytes32 cand) {
        Year = cand;
        is_active = true;  
        GC_Manager_sol = (msg.sender);
        participant_count = 0;
    }

    function verify(bytes32 name) public view returns (bool) {
        if (is_active == false) revert("Championship doesn't exist or is deactivated!");
        if (Hostels[name] == false) revert("Hostel doesn't exist!");
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

    function add_Hostel(bytes32 name) public {
        verify();
        if (Hostels[name] == true) revert("Hostel already exists!");
        Hostels[name] = true;
        participant_count += 1;
    }

    function remove_Hostel(bytes32 name) public {
        verify(name);
        Hostels[name] = false;
        participant_count -= 1;
        //emit Hostels_event("removed",name);
    }

    function add_Contest(bytes32 name) public {
        verify();
        emit Contest_event("added",name);
    }

    function remove_Contest(bytes32 name) public {
        verify();
        emit Contest_event("removed",name);
    }


    function set_Score(
        Leg type_of_contest,
        bytes32 contest,
        bytes32 team,
        uint score,
        string calldata id
    ) public {
        verify(team);
        Scores[type_of_contest][contest][team] = score;
        emit updateScore(id);
    }
}
  