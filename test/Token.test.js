import { tokens, EVM_REVERT } from './helpers'; //works using babelrc and presets


const Token = artifacts.require('./Token')


require('chai')
    .use(require('chai-as-promised'))
    .should()




//accounts from gananche automatically injected, we are naming each index ourselves
contract('Token', ([deployer, receiver, exchange]) => {
    let token;
    const name = 'Learn Token'
    const symbol = 'LEARN'
    const decimals = '18';
    const totalSupply = tokens(1000000).toString();

    //runs before each it
    beforeEach(async () => {
        token = await Token.new()            //Fetch token from blockchain
    })

    describe('deployment', () => {
        it('tracks the name', async () => {
            const result = await token.name()//Read token name here...
            result.should.equal(name)//Check token name is My Name
        })
        it('tracks the symbol', async () => {
            const result = await token.symbol()
            result.should.equal(symbol)

        })
        it('tracks the decimals', async () => {
            const result = await token.decimals()
            result.toString().should.equal(decimals)
        })
        it('tracks the total supply', async () => {
            const result = await token.totalSupply()
            result.toString().should.equal(totalSupply.toString())
        })
        it('assigns the total supply to the deployer', async () => {
            const result = await token.balanceOf(deployer);
            result.toString().should.equal(totalSupply.toString())
        })
    })

    describe('sending tokens', () => {
        let amount, result;

        describe('success', async () => {
            beforeEach(async () => {
                //Transfer
                amount = tokens(100);
                result = await token.transfer(receiver, amount,{from: deployer})
            })
            it('transfers token balances', async () => {
                let balanceOf;
            
                //after transfer
                balanceOf = await token.balanceOf(deployer)
                balanceOf.toString().should.equal(tokens(999900).toString())
                // console.log('deployer balance after transfer: ', balanceOf.toString())
                balanceOf = await token.balanceOf(receiver)
                balanceOf.toString().should.equal(tokens(100).toString())
                // console.log('receiver balance after transfer', balanceOf.toString())
            })
           
            it('emits a Tranfer event', async () => {
                // console.log(result)
                const log = result.logs[0]
                log.event.should.equal('Transfer')
                const event = log.args;
                event.from.toString().should.equal(deployer, 'from is correct')
                event.to.should.equal(receiver, 'to is correct')
                event.value.toString().should.equal(amount.toString(), 'value is correct')
            })
        })
        describe('failure', async () => {
            
            it('rejects insuffcient balances', async () => {
                let invalidAmount;
                invalidAmount = tokens(100000000) //100 million token - greater than total supply
                await token.transfer(receiver, invalidAmount, { from: deployer })
                    .should.be.rejectedWith(EVM_REVERT)
                
                //Atempt tranfer tokens, when you have none
                invalidAmount = tokens(10)
                //receiver does not have any tokens yet so should be rejected
                await token.transfer(deployer, invalidAmount, {from: receiver}).should.be.rejectedWith(EVM_REVERT)
               
            })
            it('rejects invalid recepients', async () => {
                await token.transfer(0x0, amount, { from: deployer }).should.be.rejected;
            })
           
        })

       
    })

    describe('approving tokens', () => {
        let result, amount;
        beforeEach(async () => {
            amount = tokens(100)
            result = await token.approve(exchange, amount, {from: deployer});
        })
        describe('success', () => {
            it ('allocates an allowance for delegated token spending on an exchange', async () => {
                const allowance = await token.allowance(deployer, exchange)
                allowance.toString().should.equal(amount.toString())
            })
            it('emits a Approval event', async () => {
                // console.log(result)
                const log = result.logs[0]
                log.event.should.equal('Approval')
                const event = log.args;
                event.owner.toString().should.equal(deployer, 'owner is correct')
                event.spender.should.equal(exchange, 'spender is correct')
                event.value.toString().should.equal(amount.toString(), 'value is correct')
            })
        })

        describe('failure', () => {
            it('rejects invalid spenders', async () => {
                await token.approve(0x0, amount, { from: deployer }).should.be.rejected;
            })
        })
    })

    describe('delegated token transfers', () => {
        let amount, result;

        
        beforeEach(async () => {
            amount = tokens(100)
            //approve 100 tokens for the exchange
            await token.approve(exchange, amount, {from: deployer})
        })

        describe('success', async () => {
            beforeEach(async () => {
                //Transfer
                amount = tokens(100);
                //tranfer 100 tokens to the receiver from the deployer automatically. Possible because exchange is approved for 100 tokens
                result = await token.transferFrom(deployer, receiver, amount,{from: exchange})
            })
            it('transfers token balances', async () => {
                let balanceOf;
            
                //after transfer
                balanceOf = await token.balanceOf(deployer)
                balanceOf.toString().should.equal(tokens(999900).toString())
                // console.log('deployer balance after transfer: ', balanceOf.toString())
                balanceOf = await token.balanceOf(receiver)
                balanceOf.toString().should.equal(tokens(100).toString())
                // console.log('receiver balance after transfer', balanceOf.toString())
            })
            it ('resets the allowance', async () => {
                const allowance = await token.allowance(deployer, exchange)
                allowance.toString().should.equal('0')
            })
            it('emits a Tranfer event', async () => {
                // console.log(result)
                const log = result.logs[0]
                log.event.should.equal('Transfer')
                const event = log.args;
                event.from.toString().should.equal(deployer, 'from is correct')
                event.to.should.equal(receiver, 'to is correct')
                event.value.toString().should.equal(amount.toString(), 'value is correct')
            })
        })
        describe('failure', async () => {
            
            it('rejects insuffcient amounts', async () => {
                const invalidAmount = tokens(100000000)
                await token.transferFrom(deployer, receiver, invalidAmount, {from: exchange}).should.be.rejectedWith(EVM_REVERT)
             })
             it('rejects invalid recepients', async () => {
                 // const invalidAmount = tokens(100000000)
                 await token.transferFrom(deployer, 0x0, amount, { from: exchange }).should.be.rejected;
             })
           
        })

       
    })
    
})