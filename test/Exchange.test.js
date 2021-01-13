import { tokens,ether, EVM_REVERT, ETHER_ADDRESS } from './helpers'; //works using babelrc and presets


const Exchange = artifacts.require('./Exchange')
const Token = artifacts.require('./Token')


require('chai')
    .use(require('chai-as-promised'))
    .should()




//accounts from gananche automatically injected, we are naming each index ourselves
contract('Exchange', ([deployer, feeAccount, user1, user2]) => {
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
            await exchange.depositEther({from: user1, value: amount})
        })
        it('returns user balance', async () => {
            const result = await exchange.balanceOf(ETHER_ADDRESS, user1)
            result.toString().should.equal(amount.toString())
        })
    })

    describe('making orders', async () => {
        let result;

        beforeEach(async () => {
            result = await exchange.makeOrder(token.address, tokens(1), ETHER_ADDRESS, ether(1), {from: user1})
        })

        it('tracks the newly created order', async () => {
            const orderCount = await exchange.orderCount();
            orderCount.toString().should.equal('1')
            const order = await exchange.orders('1');
            order.id.toString().should.equal('1', 'id is correct');
            order.user.should.equal(user1, 'user is correct');
            order.tokenGet.should.equal(token.address, 'tokenGet is correct');
            order.amountGet.toString().should.equal(tokens(1).toString(), 'amountGet is corrent')
            order.tokenGive.should.equal(ETHER_ADDRESS, 'tokenGive is correct')
            order.amountGive.toString().should.equal(ether(1).toString(), 'amountGive is correct')
            order.timestamp.toString().length.should.be.at.least(1, 'timestamp is present')
        })

        it('emits an "ORDER" event', async () => {
            const log = result.logs[0]
            log.event.should.eq('Order')
            const event = log.args
            event.id.toString().should.equal('1', 'id is correct');
            event.user.should.equal(user1, 'user is correct');
            event.tokenGet.should.equal(token.address, 'tokenGet is correct');
            event.amountGet.toString().should.equal(tokens(1).toString(), 'amountGet is corrent')
            event.tokenGive.should.equal(ETHER_ADDRESS, 'tokenGive is correct')
            event.amountGive.toString().should.equal(ether(1).toString(), 'amountGive is correct')
            event.timestamp.toString().length.should.be.at.least(1, 'timestamp is present')
        })
    })

    describe('Order actions', async () => {
        beforeEach(async () => {
            //user1 deposits ether
            await exchange.depositEther({ from: user1, value: ether(1) })
            //give tokens to user2
            await token.transfer(user2, tokens(100), { from: deployer });
            //user 2 deposits tokens only
            await token.approve(exchange.address, tokens(2), {from: user2})
            await exchange.depositToken(token.address, tokens(2), {from: user2})
            //user 1 makes an order to buy tokens with Ether
            await exchange.makeOrder(token.address, tokens(1), ETHER_ADDRESS, ether(1), {from: user1})
        })

        describe('filling order', async () => {
            let result

            describe('success', async () => {
                beforeEach(async () => {
                    //user 2 fills order
                    result = await exchange.fillOrder('1', { from: user2 });
                })
                it('executes the trade and charges fees', async () => {
                    let balance;
                    // result = await exchange.fillOrder('1', { from: user2 });

                    balance = await exchange.balanceOf(token.address, user1)
                    balance.toString().should.equal(tokens(1).toString(), 'user1 received tokens')
                    balance = await exchange.balanceOf(ETHER_ADDRESS, user2);
                    balance.toString().should.equal(ether(1).toString(), 'user2 received Ether')
                    balance = await exchange.balanceOf(ETHER_ADDRESS, user1);
                    balance.toString().should.equal('0', 'user2 Ether deducted');
                    balance = await exchange.balanceOf(token.address, user2)
                    balance.toString().should.equal(tokens(0.9).toString(), 'user2 tokens deducted with fee applied')
                    const feeAccount = await exchange.feeAccount();
                    balance = await exchange.balanceOf(token.address, feeAccount)
                    balance.toString().should.equal(tokens(0.1).toString(), 'feeAccount received fee')

                })

                it('updates filled orders', async () => {
                    // result = await exchange.fillOrder('1', { from: user2 });
                    const orderFilled = await exchange.orderFilled(1);
                    orderFilled.should.equal(true)
                })

                it('emits a "Trade" event', async () => {
                    // result = await exchange.fillOrder('1', { from: user2 });
                    const log = result.logs[0];
                    log.event.should.eq('Trade')
                    const event = log.args;
                    event.id.toString().should.equal('1', 'id is correct');
                    event.user.should.equal(user1, 'user is correct');
                    event.tokenGet.should.equal(token.address, 'togetGet is correct')
                    event.amountGet.toString().should.equal(tokens(1).toString(), 'amountGet is correct')
                    event.tokenGive.should.equal(ETHER_ADDRESS, 'tokenGive is correct')
                    event.amountGive.toString().should.equal(ether(1).toString(), 'amountGive is correct')
                    event.userFill.should.equal(user2, 'userFill is correct')
                    event.timestamp.toString().length.should.be.at.least(1, 'timestamp is present')
                    
                })

            })

            describe('failure', async () => {
                it('rejects invalid order ids', async () => {
                    const invalidOrderId = 99999;
                    await exchange.fillOrder(invalidOrderId, {from: user2}).should.be.rejectedWith(EVM_REVERT)
                })

                it ('rejects already filled orders', async () => {
                    //Fill the order
                    await exchange.fillOrder('1', { from: user2 }).should.be.fulfilled
                    //Try to fill it again
                    await exchange.fillOrder('1', { from: user2 }).should.be.rejectedWith(EVM_REVERT)
                })

                it('rejects cancelled orders', async () => {
                    //cancel the order
                    await exchange.cancelOrder('1', { from: user1 }).should.be.fulfilled;
                    //try to fill the order
                    await exchange.fillOrder('1', {from: user2}).should.be.rejectedWith(EVM_REVERT)
                })
            })

            
        })

        describe('cancelling order', async () => {
            let result;
            
            describe('success', async () => {
                beforeEach(async () => {
                    result = await exchange.cancelOrder('1', {from: user1})
                })
                
                it('updates cancelled orders', async () => {
                    const orderCancelled = await exchange.orderCancelled(1)
                    orderCancelled.should.equal(true)
                })

            })

            describe('failure', async () => {
                //TDO
                it('rejects invalid order ids', async () => {
                    const invalidOrderId = 99999;
                    await exchange.cancelOrder(invalidOrderId, {from: user1}).should.be.rejectedWith(EVM_REVERT)
                })

                it('rejects unauthorized cancelations', async () => {
                    await exchange.cancelOrder('1', {from: user2}).should.be.rejectedWith(EVM_REVERT)
                })
            })
            
        })
        
    })

    

    
    
})