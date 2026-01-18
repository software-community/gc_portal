// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.2 <0.9.0;
import "./General_Championship.sol";

contract GC_Manager {
    address public manager;
    mapping(address => bool) admins;
    mapping(bytes32 => address) Championships;
    event GC_Created(bytes32 year, address GC_Address);

    constructor() {
        manager = msg.sender;
    }

    function verify() private view {
        if (msg.sender != manager && !admins[msg.sender])
            revert("Unauthorised Action!");
    }

    function verify_caller(address caller) public view returns (bool) {
        return (caller == manager || admins[caller] || caller == address(this));
    }

    function add_admin_rights(address newAdmin) public {
        verify();
        admins[newAdmin] = true;
    }

    function remove_admin_rights(address admin) public {
        verify();
        admins[admin] = false;
    }

    function create_GC(bytes32 year) public {
        verify();
        if (address(Championships[year]) != address(0)) {
            revert("Championship already exists!");
        }
        Championships[year] = address(new GC(year));
        emit GC_Created(year, Championships[year]);
    }

    function end_GC(bytes32 year) public {
        verify();
        require(
            Championships[year] != address(0),
            "Championship doesn't exist or is deactivated!"
        );
        require(
            GC(Championships[year]).is_active(),
            "Championship doesn't exist or is deactivated!"
        );
        GC(Championships[year]).deactivate();
    }

    function retrieve_GC(bytes32 year) public view returns (address) {
        return Championships[year];
    }
}
