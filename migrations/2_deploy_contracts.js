//in a migration, you are changing the data on the blockchain. Number is important



const Token = artifacts.require("Token"); //looks into abis 
const Exchange = artifacts.require("Exchange"); //looks into abis 

module.exports = async function (deployer) {
  const accounts = await web3.eth.getAccounts();
  const feeAccount = accounts[0];
  const feePercent = 10;
  
  await deployer.deploy(Token);
  await deployer.deploy(Exchange, feeAccount, feePercent)
};
