import {expect} from "chai";
import hre, {ethers} from "hardhat";

describe("FlickFrenzy", function () {
    async function deployFlickFrenzyFixture() {
        const [owner, voter1, voter2] = await hre.ethers.getSigners();

        const FlickFrenzy = await hre.ethers.getContractFactory("FlickFrenzy");
        const flickFrenzy = await FlickFrenzy.deploy();

        return {owner, voter1, voter2, flickFrenzy};
    }

    describe("Deployment", function () {
        it("Should deploy FlickFrenzy with its initial values", async function () {
            const {flickFrenzy} = await deployFlickFrenzyFixture();

            expect(await flickFrenzy.frenzyCount()).to.equal(0);
        });
    });

    describe("CreateFrenzy function", function () {
        it("should create a frenzy with correct initial values", async function () {
            const {flickFrenzy} = await deployFlickFrenzyFixture();
           
            await flickFrenzy.createFrenzy("Best Movie", ["Lord of the Rings", "Indiana Jones", "Star Wars"]);
 
            expect(await flickFrenzy.frenzyCount()).to.equal(1);
 
            const newFrenzy = await flickFrenzy.frenzies(1);

            expect(newFrenzy.frenzyName).to.equal("Best Movie");
           
            const frenzyOptions = await flickFrenzy.getFrenzyOptions(1);
 
            expect(frenzyOptions[0]).to.equal("Lord of the Rings");
            expect(frenzyOptions[1]).to.equal("Indiana Jones");
            expect(frenzyOptions[2]).to.equal("Star Wars");
        });

        it("should fail if a frenzy with the same name already exists", async function () {
            const {flickFrenzy} = await deployFlickFrenzyFixture();
            const frenzyName = "Best Movie";

            await flickFrenzy.createFrenzy("Best Movie", ["Lord of the Rings", "Indiana Jones", "Star Wars"]);

            await expect(flickFrenzy.createFrenzy(frenzyName, ["Lord of the Rings", "Indiana Jones", "Star Wars"]))
            .to.be.revertedWith("Frenzy name already exists");
        });

        it("should have the status Inactive", async function () {
            const {flickFrenzy} = await deployFlickFrenzyFixture();
            const frenzyName = "Best Movie";

            await flickFrenzy.createFrenzy(frenzyName, ["Lord of the Rings", "Indiana Jones", "Star Wars"]);

            const frenzy = await flickFrenzy.frenzies(0);
            expect(frenzy.status).to.equal(0);
        })

        it("should have the correct creator", async function () {
            const {owner, flickFrenzy} = await deployFlickFrenzyFixture();
            const frenzyName = "Best Movie";

            await flickFrenzy.createFrenzy(frenzyName, ["Lord of the Rings", "Indiana Jones", "Star Wars"]);

            const frenzy = await flickFrenzy.frenzies(1);

            expect(frenzy.creator).to.equal(owner.address);
        })
     })

    describe("StartFrenzy function", function () {
        it("should allow only the owner to start the Frenzy", async function () {
            const {owner, voter1, flickFrenzy} = await deployFlickFrenzyFixture();
        
            const frenzyName = "Best Movie";
            const options = ["Lord of the Rings", "Indiana Jones", "Star Wars"];
            
            // Owner creates the Frenzy
            await flickFrenzy.connect(owner).createFrenzy(frenzyName, ["Lord of the Rings", "Indiana Jones", "Star Wars"]);

            // Fetch the frenzy and check its initial status (Inactive)
            let frenzy = await flickFrenzy.frenzies(1);
            expect(frenzy.status).to.equal(0);

            // Step 1: Ensure that a non-owner (voter1) cannot start the Frenzy before it's started
            await expect(flickFrenzy.connect(voter1).startFrenzy(1, 30)).to.be.revertedWith("Only the creator can start the frenzy");

            // Step 2: Owner starts the Frenzy successfully
            await flickFrenzy.connect(owner).startFrenzy(1, 30);
            
            // Fetch the updated frenzy and check its status (Active)
            frenzy = await flickFrenzy.frenzies(1);
            expect(frenzy.status).to.equal(1);

            // Step 3: Ensure that a non-owner (voter1) cannot start the already active Frenzy
            await expect(flickFrenzy.connect(voter1).startFrenzy(1, 30)).to.be.revertedWith("Frenzy is not in the required status.");
        });
    });
            
    describe("FlickFrenzy", function () {
        async function deployFlickFrenzyWithFrenzyFixture() {
            const [owner, voter1, voter2] = await hre.ethers.getSigners();
    
            const FlickFrenzy = await hre.ethers.getContractFactory("FlickFrenzy");
            const flickFrenzy = await FlickFrenzy.deploy();
    
            const frenzyName = "Test Frenzy";
            const options = ["Option 1", "Option 2", "Option 3"];
    
            await flickFrenzy.connect(owner).createFrenzy(frenzyName, ["Option 1", "Option 2", "Option 3"]);
    
            return {owner, voter1, voter2, flickFrenzy, frenzyName, options};
        }

        describe("GetFrenzies function", function () {
            it("should return all active Frenzies", async function () {
                const {owner, flickFrenzy, frenzyName, options} = await deployFlickFrenzyWithFrenzyFixture();
    
                await flickFrenzy.connect(owner).startFrenzy(1, 30);
    
                const activeFrenzies = await flickFrenzy.getFrenzies();
    
                expect(activeFrenzies.length).to.equal(1);
            });
        });

        describe("Vote function", function () {
            it("should allow only everyone to vote once", async function () {
                const {owner, voter1, flickFrenzy} = await deployFlickFrenzyWithFrenzyFixture();

                await flickFrenzy.connect(owner).startFrenzy(1, 30);

                await flickFrenzy.connect(voter1).vote(1, 1);
                await expect(flickFrenzy.connect(voter1).vote(1, 1)).to.be.revertedWith("You can only vote one time per Frenzy.");
            });

            it("should limit the vote to the number of options", async function () {
                const {owner, voter1, flickFrenzy} = await deployFlickFrenzyWithFrenzyFixture();

                await flickFrenzy.connect(owner).startFrenzy(1, 30);

                await expect(flickFrenzy.connect(voter1).vote(1, 4)).to.be.revertedWith("Invalid option, must be 0, 1, or 2.");
            });
        });

        describe("CheckFrenzy function", function () {
            it("Should revert if the Frenzy is not active", async function () {
                const {owner, flickFrenzy} = await deployFlickFrenzyWithFrenzyFixture();

                await expect(flickFrenzy.checkFrenzy(1)).to.be.revertedWith("Frenzy is not active.");
            });

            it("should revert if the Frenzy duration has not passed", async function () {
                const {owner, flickFrenzy} = await deployFlickFrenzyWithFrenzyFixture();

                await flickFrenzy.connect(owner).startFrenzy(1, 30);

                await expect(flickFrenzy.checkFrenzy(1)).to.be.revertedWith("Frenzy is still active.");
            });

            it("should complete the Frenzy if duration has passed", async function () {
                const { owner, flickFrenzy } = await deployFlickFrenzyWithFrenzyFixture();
                
                await flickFrenzy.connect(owner).startFrenzy(1, 30); // 30 seconds duration
        
                // Simulate passing time by increasing block timestamp
                await hre.network.provider.send("evm_increaseTime", [31]); // Increase time by 31 seconds
                await hre.network.provider.send("evm_mine");
        
                await flickFrenzy.checkFrenzy(1);
                
                const frenzy = await flickFrenzy.frenzies(1);
                expect(frenzy.status).to.equal(2); // Status.Completed (2)
            });

            it("should determine the winner and emit FrenzyCompleted event", async function () {
                const { owner, voter1, voter2, flickFrenzy, frenzyName, options} = await deployFlickFrenzyWithFrenzyFixture();
                
                await flickFrenzy.connect(owner).startFrenzy(1, 30);
        
                await flickFrenzy.connect(voter1).vote(1, 0);
                await flickFrenzy.connect(voter2).vote(1, 1);
                await flickFrenzy.connect(owner).vote(1, 1);

                // Simulate passing time by increasing block timestamp
                await hre.network.provider.send("evm_increaseTime", [31]); // Increase time by 31 seconds
                await hre.network.provider.send("evm_mine"); // Mine a new block to update the block timestamp to the new time

                await expect(flickFrenzy.checkFrenzy(1))
                    .to.emit(flickFrenzy, "FrenzyCompleted").withArgs(frenzyName, options, "Option 2");
            });
        });

        describe("Receive function", function () {
            it("should revert when sending ETH to the contract", async function () {
                const { owner, flickFrenzy } = await deployFlickFrenzyWithFrenzyFixture();
                
                await expect(owner.sendTransaction({
                    to: flickFrenzy.getAddress(),
                    value: hre.ethers.parseEther("1")
                })
                ).to.be.revertedWith("Contract does not accept Ether.");
            });
        });
    });
});
