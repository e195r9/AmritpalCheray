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
    uint = uint256
 */


contract Exchange{
    using SafeMath for uint256;
    //Variables
    address public feeAccount; //the account that receives exchange fees
    uint256 public feePercent; //the fee percentage
    address constant ETHER = address(0);//store Ether in tokens mapping with blank address
    

    //what token has been deposit[first key], who deposited the token [second key]
    mapping (address => mapping(address => uint256)) public tokens;
    //track the orders using a mapping (array)
    mapping(uint256 => _Order) public orders;
    uint256 public orderCount; //solidty can't find mapping length automatically

    //mapping of canceled orders
    mapping(uint256 => bool) public orderCancelled;
    //mapping of filled order
    mapping (uint256 => bool) public orderFilled;



    //EVENTS
    event Deposit(address token, address user, uint256 amount, uint256 balance);
    event Withdraw(address token, address user, uint256 amount, uint256 balance);
    event Order(
        uint256 id, 
        address user,
        address tokenGet,
        uint256 amountGet,
        address tokenGive,
        uint256 amountGive,
        uint256 timestamp
    );
    event Cancel(
        uint id, 
        address user,
        address tokenGet,
        uint amountGet,
        address tokenGive,
        uint amountGive,
        uint timestamp
    );
    //userfill is the user who filled the order
    event Trade(
        uint256 id, 
        address user,
        address tokenGet,
        uint256 amountGet,
        address tokenGive,
        uint256 amountGive,
        address userFill, 
        uint256 timestamp
    );



    //Need 3 things
    //1. a way to model the order: using a struct
    //underscore means 
    struct _Order {
        //allows us to model the order
        uint id;
        address user;
        address tokenGet;
        uint amountGet;
        address tokenGive;
        uint amountGive;
        uint timestamp;
    }
   


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

    function makeOrder(address _tokenGet, uint256 _amountGet, address _tokenGive, uint256 _amountGive) public {
        orderCount = orderCount.add(1);
        orders [orderCount]  = _Order(orderCount, msg.sender, _tokenGet, _amountGet, _tokenGive, _amountGive, block.timestamp);
        emit Order(orderCount, msg.sender, _tokenGet, _amountGet, _tokenGive, _amountGive, block.timestamp);
    }

    function cancelOrder(uint256 _id) public {
          //Must be a valid order
        //we are looking for a order at _id and we want to fetch it from storage specifically
        _Order storage _order =  orders[_id];
        
        //Must be 'my' order
        require(address(_order.user) == msg.sender);
        require(_order.id == _id); //The order must exists
        orderCancelled[_id] = true;
        emit Cancel(_order.id, msg.sender, _order.tokenGet, _order.amountGet, _order.tokenGive, _order.amountGive, block.timestamp);

    }
    function fillOrder(uint256 _id) public{
        require(_id > 0 && _id <= orderCount);
        require(!orderFilled[_id]);
        require(!orderCancelled[_id]);

        //fetch the order
        _Order storage _order =  orders[_id]; 
        _trade(_order.id, _order.user, _order.tokenGet, _order.amountGet, _order.tokenGive, _order.amountGive);
        //mark the order as filled
        orderFilled[_order.id] = true;  
    }

    //internal function only
    function _trade (uint _orderId, address _user, address _tokenGet, uint _amountGet, address _tokenGive, uint _amountGive) internal{
        //FEES
        //fee paid by the user that fills the order
        //fee deducted from _amountGet
        uint256 _feeAmount = _amountGet.mul(feePercent).div(100); //convert the fee into percent and multiply by amountGet
        

        //EXECUTE THE TRADE
        //_user is the person who created the order
        //msg.sender is the person filling the order

        //DEDUCT FEE AMOUNT
        tokens[_tokenGet][msg.sender] = tokens[_tokenGet][msg.sender].sub(_amountGet.add(_feeAmount));

        //subtract the amount from the person filling the order
       // tokens[_tokenGet][msg.sender] = tokens[_tokenGet][msg.sender].sub(_amountGet.add(_feeAmount));
        //add the amount to the user who created the order
        tokens[_tokenGet][_user] = tokens[_tokenGet][_user].add(_amountGet);

        //COLLECT THE FEE
        tokens[_tokenGet][feeAccount] = tokens[_tokenGet][feeAccount].add(_feeAmount);

        //subtract the amount give from the person who created the order
        tokens[_tokenGive][_user] = tokens[_tokenGive][_user].sub(_amountGive);
        //add the amount to the person who is filling the order. 
        tokens[_tokenGive][msg.sender] = tokens[_tokenGive][msg.sender].add(_amountGive);

        //emit a trade event 
        emit Trade(_orderId, _user, _tokenGet, _amountGet, _tokenGive, _amountGive, msg.sender, block.timestamp);
    }
}
