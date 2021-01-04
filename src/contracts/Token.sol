// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";



contract Token{
    using SafeMath for uint256;


    //Variables
    string public name = "Learn Token";
    string public symbol = "LEARN";
    uint256 public decimals = 18 ; //number of sub units we can divide our token into
    uint256 public totalSupply;
    

    //Track balances
    mapping(address => uint256)public balanceOf;

    //Track the amount the exhange is allowed to expend
    //the nested mapping indicates the specific place/exchange 
    mapping(address => mapping(address => uint256))public allowance;
   

    //Events
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    constructor() {
        totalSupply = 1000000 * (10** decimals); //1 million tokens, however, stored as cents thus multiple by the units. 
        balanceOf[msg.sender] = totalSupply;  //msg is a global variable. msg.sender is the person who is calling this function

    }

    function transfer(address _to, uint256 _value) public returns (bool success){
        
        require(balanceOf[msg.sender] >= _value); //require the sender to have enough tokens to send
        _transfer(msg.sender, _to, _value);
        return true;
    }


    function _transfer(address _from, address _to, uint256 _value) internal{
        require(_to != address(0));
        balanceOf[_from] = balanceOf[_from].sub(_value); //sub is not native
        balanceOf[_to] = balanceOf[_to].add(_value);
        emit Transfer(_from, _to, _value);
    }


    //Approve Tokens - allow someone to transfer 
    function approve(address _spender, uint256 _value) public returns(bool success){
        require(_spender != address(0));
        allowance[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }
    
    //Tranfer From
    function transferFrom(address _from, address _to, uint256 _value) public returns (bool success){
        //must be less than the value available
        require(_value <= balanceOf[_from]);
        //must be less than exchange's allowance
        require(_value <= allowance[_from][msg.sender]);

        //subtract from exchange's allowance
        allowance[_from][msg.sender] = allowance[_from][msg.sender].sub(_value);
        _transfer(_from, _to, _value);

        return true;
    }
}