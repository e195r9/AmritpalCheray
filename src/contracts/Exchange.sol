// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import './Token.sol';
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

/**
Handle all behaviour of decentralized exhange
    Deposit and Withdraw Funds
    Manage orders - make or cancel
    handle trandes - charge fees
*/

/**
    set the fee account
    deposit ether
    withdraw ether
    deposit tokens
 */


contract Exchange{
    using SafeMath for uint256;
    //Variables
    address public feeAccount; //the account that receives exchange fees
    uint256 public feePercent; //the fee percentage
    address constant ETHER = address(0);//store Ether in tokens mapping with blank address
    

    //what token has been deposit[first key], who deposited the token [second key]
    mapping (address => mapping(address => uint256)) public tokens;


    //EVENTS
    event Deposit(address token, address user, uint256 amount, uint256 balance);
    event Withdraw(address token, address user, uint256 amount, uint256 balance);

    constructor (address _feeAccount, uint256 _feePercent) {
        //set fee account
        feeAccount = _feeAccount;
        feePercent = _feePercent;

    }

    //Fallback: reverts if Ether is sent to this smart contract by mistake
    fallback()  external{
        revert();
    }


    function depositEther()payable public{
        tokens[ETHER][msg.sender] = tokens[ETHER][msg.sender].add(msg.value);
        emit Deposit(ETHER, msg.sender, msg.value,  tokens[ETHER][msg.sender]);

    }

    function withdrawEther(uint _amount) public {
        require(tokens[ETHER][msg.sender] >= _amount); //the user holds enough balance to withdraw
        tokens[ETHER][msg.sender] = tokens[ETHER][msg.sender].sub(_amount);
        payable(msg.sender).transfer(_amount);
        emit Withdraw(ETHER, msg.sender, _amount,  tokens[ETHER][msg.sender]);

    }

    function depositToken(address _token, uint256 _amount) public {
        //Don't allow ether deposits
        require(_token != ETHER);
        //which token are we going to deposit? how much of it?
        //send tokens to this contract
        require (Token(_token).transferFrom(msg.sender, address(this), _amount));
        

        //track the balance of the exchange and manage deposit
        tokens[_token][msg.sender] = tokens[_token][msg.sender].add(_amount);

        //emit event to tell customer of response
        emit Deposit(_token, msg.sender, _amount,  tokens[_token][msg.sender]);
    }

    function withdrawToken(address _token, uint256 _amount) public {
        require(_token != ETHER);
        require(tokens[_token][msg.sender] >= _amount);
        require(Token(_token).transfer(msg.sender, _amount)); //require that the tokens get transferred back to the user
        tokens[_token][msg.sender]  = tokens[_token][msg.sender].sub(_amount);
        //emit the withdraw event
        emit Withdraw(_token, msg.sender, _amount,  tokens[_token][msg.sender]);
    }
    function balanceOf(address _token, address _user) public view returns(uint256){
        return tokens[_token][_user];
        
    }
}
