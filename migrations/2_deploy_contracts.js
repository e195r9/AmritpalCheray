//in a migration, you are changing the data on the blockchain. Number is important

const Token = artifacts.require("Token"); //looks into abis 

module.exports = function (deployer) {
  deployer.deploy(Token);
};
