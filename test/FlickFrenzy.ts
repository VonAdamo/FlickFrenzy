import {expect} from "chai";
import hre from "hardhat";

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

        it("Should create a frenzy with all the necessary fields", async function () {
            const {flickFrenzy} = await deployFlickFrenzyFixture();
            const frenzy = await flickFrenzy.frenzies(1);

            await flickFrenzy.createFrenzy(frenzy.frenzyName, frenzy.);

            expect(frenzy).to.have.property("frenzyId");
        })

        it("should fail if a frenzy with the same name already exists", async function () {
            const {flickFrenzy} = await deployFlickFrenzyFixture();
            const frenzyName = "Best Movie";

            await flickFrenzy.createFrenzy("Best Movie", ["Lord of the Rings", "Indiana Jones", "Star Wars"]);

            await expect(flickFrenzy.createFrenzy(frenzyName, ["Lord of the Rings", "Indiana Jones", "Star Wars"]))
            .to.be.revertedWith("Frenzy name already exists");
        })

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

    /* describe("StartFrenzy function", function () {
        it("should ", async function () {
            const {owner, flickFrenzy} = await deployFlickFrenzyFixture();
            const frenzy = await flickFrenzy.frenzies(1);

            // Check that the creator of the frenzy is the owner (i.e., msg.sender)
            expect(frenzy.creator).to.equal(owner.address);
        });
    }) */
})