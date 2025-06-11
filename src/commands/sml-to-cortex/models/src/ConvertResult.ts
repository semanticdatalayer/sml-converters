import Guard from "utils/Guard";

import { IConverterResult } from "./IConvertResult";
import { IYamlCatalog } from "./yaml/IYamlCatalog";
import { IYamlCompositeModel } from "./yaml/IYamlCompositeModel";
import { IYamlConnection } from "./yaml/IYamlConnection";
import { IYamlDataset } from "./yaml/IYamlDataset";
import { IYamlDimension, IYamlNormalDimension } from "./yaml/IYamlDimension";
import { IYamlMeasure, IYamlMeasureCalculated } from "./yaml/IYamlMeasure";
import { IYamlModel } from "./yaml/IYamlModel";
import { IYamlObject } from "./yaml/IYamlObject";
import { IYamlRowSecurity } from "./yaml/IYamlRowSecurity";

export class ConvertResult {
  private _connections: Array<IYamlConnection> = [];
  private _models: Array<IYamlModel> = [];
  private _datasets: Array<IYamlDataset> = [];
  private _dimensions: Array<IYamlNormalDimension> = [];
  private _measures: Array<IYamlMeasure> = [];
  private _measuresCalculated: Array<IYamlMeasureCalculated> = [];
  private _catalog?: IYamlCatalog = undefined;
  private _rowSecurity: Array<IYamlRowSecurity> = [];
  private _compositeModels: Array<IYamlCompositeModel> = [];

  public get catalog(): IYamlCatalog {
    return Guard.ensure(this._catalog, "catalog is nto set");
  }

  public set catalog(value: IYamlCatalog) {
    Guard.should(this._catalog === undefined, `catalog is already set!`);
    this._catalog = value;
  }

  private allObjects(): Array<IYamlObject> {
    const result: Array<IYamlObject> = [
      ...this._connections,
      ...this._datasets,
      ...this._dimensions,
      ...this._dimensions,
      ...this._measures,
      ...this._measuresCalculated,
      ...this._models,
      ...this._rowSecurity,
      ...this._compositeModels,
    ];

    if (this._catalog) {
      result.push(this._catalog);
    }

    return result;
  }

  private addObjectToArray<T extends IYamlObject>(array: Array<T>, item: T) {
    //ensure unique_name is unique

    const otherObject = this.allObjects().find(
      (o) => o.unique_name === item.unique_name && o.object_type === item.object_type
    );

    if (otherObject) {
      throw new Error(
        `Cannot add "${item.object_type}" with unique_name: "${item.unique_name}". There is already a "${otherObject.object_type}" with same unique_name`
      );
    }

    array.push(item);
  }

  addConnection(connection: IYamlConnection) {
    this.addObjectToArray(this._connections, connection);
  }

  addModel(model: IYamlModel) {
    this.addObjectToArray(this._models, model);
  }

  addCompositeModel(compositeModel: IYamlCompositeModel) {
    this.addObjectToArray(this._compositeModels, compositeModel);
  }

  addDatasets(dataset: IYamlDataset) {
    this.addObjectToArray(this._datasets, dataset);
  }

  addDimension(dimension: IYamlDimension) {
    this.addObjectToArray(this._dimensions, dimension);
  }

  addMeasures(measure: IYamlMeasure) {
    this.addObjectToArray(this._measures, measure);
  }

  addMeasuresCalc(measureCalc: IYamlMeasureCalculated) {
    this.addObjectToArray(this._measuresCalculated, measureCalc);
  }

  addRowSecurity(rowSecurity: IYamlRowSecurity) {
    this.addObjectToArray(this._rowSecurity, rowSecurity);
  }

  getResult(): IConverterResult {
    return {
      connections: this._connections,
      datasets: this._datasets,
      dimensions: this._dimensions,
      measures: this._measures,
      measuresCalculated: this._measuresCalculated,
      models: this._models,
      catalog: this.catalog,
      rowSecurity: this._rowSecurity,
      compositeModels: this._compositeModels,
    };
  }

  public get connections() {
    return this._connections;
  }

  public get models() {
    return this._models;
  }

  public get datasets() {
    return this._datasets;
  }

  public get dimensions() {
    return this._dimensions;
  }

  public get measures() {
    return this._measures;
  }

  public get measuresCalculated() {
    return this._measuresCalculated;
  }

  public get rowSecurity() {
    return this._rowSecurity;
  }

  public get compositeModels() {
    return this._compositeModels;
  }
}
