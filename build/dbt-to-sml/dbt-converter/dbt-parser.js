"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DbtParser = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const zod_1 = require("zod");
const dbt_selectors_schema_1 = require("../dbt-models/schemas/dbt-selectors.schema");
const Guard_1 = __importDefault(require("../../shared/Guard"));
const model_1 = require("../model");
const dbt_project_schema_1 = require("../dbt-models/schemas/dbt-project.schema");
const dbt_packages_schema_1 = require("../dbt-models/schemas/dbt-packages.schema");
const dbt_yaml_schema_1 = require("../dbt-models/schemas/dbt-yaml.schema");
class DbtIndexBuilder {
    constructor() {
        this.data = {};
    }
    static create() {
        return new DbtIndexBuilder();
    }
    setPackages(input) {
        Guard_1.default.ensure(this.data.packages === undefined, "Cannot set DbtPackages two times");
        this.data.packages = input;
    }
    setProject(input) {
        Guard_1.default.ensure(this.data.project === undefined, "Cannot set DbtProject two times");
        this.data.project = input;
    }
    setSelectors(input) {
        Guard_1.default.ensure(this.data.selectors === undefined, "Cannot set DbtProject two times");
        this.data.selectors = input;
    }
    addYamlFile(input) {
        if (!this.data.properties) {
            this.data.properties = {
                analyses: [],
                exposures: [],
                groups: [],
                macros: [],
                metrics: [],
                models: [],
                seeds: [],
                snapshots: [],
                sources: [],
                semantic_models: [],
                version: 2,
            };
        }
        this.mergeDbtProperties(this.data.properties, input);
    }
    getData() {
        return {
            packages: this.data.packages,
            project: Guard_1.default.ensure(this.data.project, "No project found"),
            selectors: this.data.selectors,
            properties: Guard_1.default.ensure(this.data.properties, "No dbt yaml files are found"),
        };
    }
    mergeDbtProperties(target, source) {
        Object.keys(target).forEach((propName) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const sourceValue = source[propName];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const targetValue = target[propName];
            if (Array.isArray(sourceValue) && Array.isArray(targetValue)) {
                targetValue.push(...sourceValue);
            }
        });
    }
}
const getErrorMessage = (e) => {
    if (!e) {
        return "unknown error";
    }
    if (e instanceof Error) {
        return e.message;
    }
    if (typeof e === "string") {
        return e;
    }
    return `${e}`;
};
const MAX_RECURSION_DEPTH = 50;
const dbtFiles = Object.freeze({
    project: "dbt_project.yml",
    selectors: "selectors.yml",
    packages: "packages.yml",
});
const yamlExtensions = Object.freeze(["yml", "yaml"]);
class DbtParser {
    constructor(logger) {
        this.logger = logger;
    }
    parseFolder(rootFolder) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const dbtIndexBuilder = DbtIndexBuilder.create();
            const { project, packages, selectors, subFolders } = yield this.parseRootFolder(rootFolder);
            dbtIndexBuilder.setProject(project);
            if (packages) {
                dbtIndexBuilder.setPackages(packages);
            }
            if (selectors) {
                dbtIndexBuilder.setSelectors(selectors);
            }
            const definedModelsPaths = (_a = project["model-paths"]) !== null && _a !== void 0 ? _a : ["models"];
            definedModelsPaths.forEach((path) => {
                Guard_1.default.should(path.indexOf("/") < 0, `Nested models paths are nt yet supported. Path: "${path}"`);
                const existingPath = subFolders.find((subFolder) => path.normalize(subFolder) === path.normalize(path));
                Guard_1.default.should(existingPath !== undefined, `Model path ${path} does nto exists"`);
            });
            yield Promise.all(definedModelsPaths.map((modelPath) => {
                const absolutePath = path_1.default.join(rootFolder, modelPath);
                return this.parseFolderRecursive(absolutePath, dbtIndexBuilder);
            }));
            return dbtIndexBuilder.getData();
        });
    }
    parseRootFolder(rootFolder) {
        return __awaiter(this, void 0, void 0, function* () {
            const { files, folders } = yield this.getFilesAndFolders(rootFolder);
            const projectFile = Guard_1.default.ensure(files.find((f) => f === dbtFiles.project), `Cannot find project file in root with file name: ${dbtFiles.project}`);
            const project = yield this.parseDbtFile(path_1.default.join(rootFolder, projectFile), model_1.DbtFileType.project);
            const packageFileName = files.find((f) => f === dbtFiles.packages);
            let packages;
            if (packageFileName) {
                packages = yield this.parseDbtFile(path_1.default.join(rootFolder, packageFileName), model_1.DbtFileType.package);
            }
            let selectors;
            const selectorsFileName = files.find((f) => f === dbtFiles.selectors);
            if (selectorsFileName) {
                selectors = yield this.parseDbtFile(path_1.default.join(rootFolder, selectorsFileName), model_1.DbtFileType.selectors);
            }
            return {
                project,
                packages,
                selectors,
                subFolders: folders,
            };
        });
    }
    getFilesAndFolders(folderPath) {
        return __awaiter(this, void 0, void 0, function* () {
            const filesOrFolders = yield promises_1.default.readdir(folderPath);
            const result = {
                folders: [],
                files: [],
            };
            const statPromises = filesOrFolders
                .filter((x) => !x.startsWith("."))
                .map((x) => {
                const filePath = path_1.default.join(folderPath, x);
                return promises_1.default.stat(filePath).then((statResult) => {
                    return {
                        name: x,
                        statResult,
                    };
                });
            });
            const stats = yield Promise.all(statPromises);
            stats.forEach((fileOrFolder) => {
                if (fileOrFolder.statResult.isDirectory()) {
                    result.folders.push(fileOrFolder.name);
                }
                else if (fileOrFolder.statResult.isFile()) {
                    result.files.push(fileOrFolder.name);
                }
            });
            return result;
        });
    }
    parseFolderRecursive(currentFolder_1, dbtIndexBuilder_1) {
        return __awaiter(this, arguments, void 0, function* (currentFolder, dbtIndexBuilder, depth = 0) {
            if (depth > MAX_RECURSION_DEPTH) {
                throw Error(`Max recursion depth exceeded. current depth: ${depth}. current folder ${currentFolder}`);
            }
            const { files, folders } = yield this.getFilesAndFolders(currentFolder);
            yield Promise.all(files.map((file) => this.parseFile(path_1.default.join(currentFolder, file), dbtIndexBuilder)));
            yield Promise.all(folders.map((folder) => this.parseFolderRecursive(path_1.default.join(currentFolder, folder), dbtIndexBuilder, depth + 1)));
        });
    }
    parseFile(filePath, dbtIndexBuilder) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!this.isYamlFile(filePath)) {
                    return;
                }
                const parsedContent = yield this.parseDbtFile(filePath, model_1.DbtFileType.property);
                dbtIndexBuilder.addYamlFile(parsedContent);
            }
            catch (e) {
                const msg = getErrorMessage(e);
                throw new Error(`Error parsing file ${filePath}. ${msg}`);
            }
        });
    }
    parseDbtFile(filePath, type) {
        return __awaiter(this, void 0, void 0, function* () {
            const schemaParsersMap = {
                [model_1.DbtFileType.project]: dbt_project_schema_1.dbtProjectSchema,
                [model_1.DbtFileType.package]: dbt_packages_schema_1.dbtPackagesSchema,
                [model_1.DbtFileType.selectors]: dbt_selectors_schema_1.dbtSelectorsSchema,
                [model_1.DbtFileType.property]: dbt_yaml_schema_1.dbtPropertySchema,
            };
            const schemaParsers = schemaParsersMap[type];
            try {
                const fileContent = promises_1.default.readFile(filePath, { encoding: "utf8" });
                const parsedResult = schemaParsers.parse(fileContent);
                return parsedResult;
            }
            catch (err) {
                const msg = `Error parsing file "${filePath}"`;
                if (err instanceof zod_1.z.ZodError) {
                    const allErrors = err.issues.map((i) => `Path: "${i.path}". Code: "${i.code}". "${i.message}"`);
                    throw new Error(`${msg}. Invalid file schema. Errors: ${allErrors.join(". ")}`);
                }
                else {
                    throw new Error(`${msg}. ${getErrorMessage(err)}`);
                }
            }
        });
    }
    isYamlFile(filePath) {
        return yamlExtensions.includes(path_1.default.extname(filePath));
    }
}
exports.DbtParser = DbtParser;
