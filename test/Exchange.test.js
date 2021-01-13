import { tokens,ether, EVM_REVERT, ETHER_ADDRESS } from './helpers'; //works using babelrc and presets


const Exchange = artifacts.require('./Exchange')
const Token = artifacts.require('./Token')


require('chai')
    .use(require('chai-as-promised'))
    .should()




//accounts from gananche automatically injected, we are naming each index ourselves
contract('Exchange', ([deployer, feeAccount, user1]) => {
    let exchange, token;
   const feePercent = 10

    //runs before each it
    beforeEach(async () => {
        token = await Token.new()            //Fetch token from blockchain
        //tranfer tokens to user 1
        token.transfer(user1, tokens(100), {from: deployer})
        //deploy exchange
        exchange = await Exchange.new(feeAccount, feePercent)            //Fetch token from blockchain
    })

    describe('deployment', () => {
        it('tracks the fee account', async () => {
            const result = await exchange.feeAccount()//Read token name here...
            result.should.equal(feeAccount)//Check token name is My Name
        })
        it('tracks the fee percent', async () => {
            const result = await exchange.feePercent()//Read token name here...
            result.toString().should.equal(feePercent.toString())//Check token name is My Name
        })
      
    })

    describe('fallback', () => {
        it('reverts when Ether is sent', async () => {
            //refund when ehter is sent to exchange address
            await exchange.sendTransaction({ value: 1, from: user1 }).should.be.rejectedWith(EVM_REVERT);
        })
    })

    describe('depositing Ether', async () => {
        let result, amount;
        beforeEach(async () => {
            amount = ether(1)
            result = await exchange.depositEther({from: user1, value:amount})
        })
        it('tracks the Ether deposit', async () => {
            const balance = await exchange.tokens(ETHER_ADDRESS, user1)
            balance.toString().should.equal(amount.toString())
        })
        it('emits a Deposit event', async () => {
            // console.log(result)
            const log = result.logs[0]
            log.event.should.equal('Deposit')
            const event = log.args;
            event.token.toString().should.equal(ETHER_ADDRESS, 'token address is correct')
            event.user.should.equal(user1, 'user address is correct')
            event.amount.toString().should.equal(amount.toString(), 'amount is correct')
            event.balance.toString().should.equal(amount.toString(), 'balance is correct')
        })
    })
    describe('withdrawing Ether', async () => {
        let result, amount;
        beforeEach(async () => {
            amount = ether(1)
            await exchange.depositEther({from: user1, value:amount})
        })
        describe('success', async () => {
            beforeEach(async () => {
                result = await exchange.withdrawEther(amount, {from: user1})
            })
            it('withdraws Ether deposit', async () => {
                const balance = await exchange.tokens(ETHER_ADDRESS, user1)
                balance.toString().should.equal('0')
            })
            it('emits a Withdraw event', async () => {
                // console.log(result)
                const log = result.logs[0]
                log.event.should.equal('Withdraw')
                const event = log.args;
                event.token.toString().should.equal(ETHER_ADDRESS, 'token address is correct')
                event.user.should.equal(user1, 'user address is correct')
                event.amount.toString().should.equal(amount.toString(), 'amount is correct')
                event.balance.toString().should.equal('0', 'balance is correct')
            })
        })
        describe('failure', () => {
            it('rejects withraws for insufficient balances', async () => {
                await exchange.withdrawEther(ether(100), {from: user1}).should.be.rejectedWith(EVM_REVERT)
            })
        })
    })

    describe('depositing tokens', () => {
        let result, amount;

        
        describe('success', () => {
            beforeEach(async () => {
                amount = tokens(10);
                await token.approve(exchange.address, amount, {from: user1})
                result = await exchange.depositToken(token.address, amount, {from: user1})
            })
            it('tracks the token deposit', async () => {
                //check token balance updated to this smart contract
                let balance = await token.balanceOf(exchange.address)
                balance.toString().should.equal(amount.toString())
                //check tokens on exchange
                balance = await exchange.tokens(token.address, user1)//get balance of this token for user1
                balance.toString().should.equal(amount.toString())

            })

            it('emits a Deposit event', async () => {
                // console.log(result)
                const log = result.logs[0]
                log.event.should.equal('Deposit')
                const event = log.args;
                event.token.toString().should.equal(token.address, 'token address is correct')
                event.user.should.equal(user1, 'user address is correct')
                event.amount.toString().should.equal(amount.toString(), 'amount is correct')
                event.balance.toString().should.equal(amount.toString(), 'balance is correct')
            })
            
        })
        describe('failure', () => {
            it('rejects Ether deposits', async () => {
                await exchange.depositToken(ETHER_ADDRESS, amount, {from: user1}).should.be.rejectedWith(EVM_REVERT)
            })
            
            it('fails when no tokens are approved', async () => {
               //don't approve any tokens before depositing
               
                await exchange.depositToken(token.address, amount, {from: user1}).should.be.rejectedWith(EVM_REVERT)
           })
        })
      
    })

    describe('withdrawing tokens', async () => {
        let result, amount;
       
        describe('success', async () => {
            // beforeEach(async () => {
            //     result = await exchange.withdrawEther(amount, {from: user1})
            // })
            beforeEach(async () => {
                amount = ether(10);
                await token.approve(exchange.address, amount, {from: user1})
                await exchange.depositToken(token.address, amount, {from: user1})
    
                //Withdraw tokens
                result  = await exchange.withdrawToken(token.address, amount, {from: user1})
            })
            it('withdraws token deposit', async () => {
                const balance = await exchange.tokens(ETHER_ADDRESS, user1)
                balance.toString().should.equal('0')
            })
            it('emits a Withdraw event', async () => {
                // console.log(result)
                const log = result.logs[0]
                log.event.should.equal('Withdraw')
                const event = log.args;
                event.token.toString().should.equal(token.address, 'token address is correct')
                event.user.should.equal(user1, 'user address is correct')
                event.amount.toString().should.equal(amount.toString(), 'amount is correct')
                event.balance.toString().should.equal('0', 'balance is correct')
            })
        })
        describe('failure', () => {
            it('rejects Ether withdraws', async () => {
                await exchange.withdrawToken(ETHER_ADDRESS, amount, { from: user1 }).should.be.rejectedWith(EVM_REVERT);
            })
            it('fails for insufficient balances', async () => {
                await exchange.withdrawToken(token.address, amount, {from: user1}).should.be.rejectedWith(EVM_REVERT)
            })
        })
    })

    describe('checking balances', async () => {
        let amount;
        beforeEach(async () => {
            amount = ether(1)
            exchange.depositEther({from: user1, value: amount})
        })
        it('returns user balance', async () => {
            const result = await exchange.balanceOf(ETHER_ADDRESS, user1)
            result.toString().should.equal(amount.toString())
        })
    })

    

    
    
})