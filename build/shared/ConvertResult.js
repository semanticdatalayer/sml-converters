"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConvertResult = void 0;
const Guard_1 = __importDefault(require("./Guard"));
class ConvertResult {
    constructor() {
        this._connections = [];
        this._models = [];
        this._datasets = [];
        this._dimensions = [];
        this._measures = [];
        this._measuresCalculated = [];
        this._catalog = undefined;
    }
    get catalog() {
        return Guard_1.default.ensure(this._catalog, "catalog is nto set");
    }
    set catalog(value) {
        Guard_1.default.should(this._catalog === undefined, `catalog is already set!`);
        this._catalog = value;
    }
    allObjects() {
        const result = [
            ...this._connections,
            ...this._datasets,
            ...this._dimensions,
            ...this._dimensions,
            ...this._measures,
            ...this._measuresCalculated,
            ...this._models,
        ];
        if (this._catalog) {
            result.push(this._catalog);
        }
        return result;
    }
    addObjectToArray(array, item) {
        //ensure unique_name is unique
        const otherObject = this.allObjects().find((o) => o.unique_name === item.unique_name && o.object_type === item.object_type);
        if (otherObject) {
            throw new Error(`Cannot add "${item.object_type}" with unique_name: "${item.unique_name}". There is already a "${otherObject.object_type}" with same unique_name`);
        }
        array.push(item);
    }
    addConnection(connection) {
        this.addObjectToArray(this._connections, connection);
    }
    addModel(model) {
        this.addObjectToArray(this._models, model);
    }
    addDatasets(dataset) {
        this.addObjectToArray(this._datasets, dataset);
    }
    addDimension(dimension) {
        this.addObjectToArray(this._dimensions, dimension);
    }
    addMeasures(measure) {
        this.addObjectToArray(this._measures, measure);
    }
    addMeasuresCalc(measureCalc) {
        this.addObjectToArray(this._measuresCalculated, measureCalc);
    }
    getResult() {
        return {
            connections: this._connections,
            datasets: this._datasets,
            dimensions: this._dimensions,
            measures: this._measures,
            measuresCalculated: this._measuresCalculated,
            models: this._models,
            catalog: this.catalog,
        };
    }
    get connections() {
        return this._connections;
    }
    get models() {
        return this._models;
    }
    get datasets() {
        return this._datasets;
    }
    get dimensions() {
        return this._dimensions;
    }
    get measures() {
        return this._measures;
    }
    get measuresCalculated() {
        return this._measuresCalculated;
    }
}
exports.ConvertResult = ConvertResult;
