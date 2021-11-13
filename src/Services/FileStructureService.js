const fs = require("fs");

class FileStructureService {
    getStructure() {
        let fileStructure;
        this.construct("", fileStructure)
    }

    construct(folder, completeStructure) {
        const getFolderContentList = fs.readdirSync(process.cwd() + "/contentDelivery" + folder, { withFileTypes: true })
        console.log(getFolderContentList)
    }

    getFile(filePath) {

    }

    getFilePathAsString(path) {

    }
}


module.exports = FileStructureService;