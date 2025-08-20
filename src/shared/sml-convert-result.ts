import {
  SMLCatalog,
  SMLConnection,
  SMLDataset,
  SMLDimension,
  SMLMetric,
  SMLMetricCalculated,
  SMLModel,
  SMLNormalDimension,
  SMLObject,
  SMLRowSecurity,
  SMLCompositeModel,
} from "sml-sdk";

import Guard from "./guard";
import { Logger } from "./logger";

export interface SmlConverterResult {
  connections: Array<SMLConnection>;
  models: Array<SMLModel>;
  datasets: Array<SMLDataset>;
  dimensions: Array<SMLDimension>;
  measures: Array<SMLMetric>;
  measuresCalculated: Array<SMLMetricCalculated>;
  compositeModels: Array<SMLCompositeModel>;
  rowSecurity: Array<SMLRowSecurity>;
  catalog: SMLCatalog;
}

export function logSmlConverterResult(
  smlResult: SmlConverterResult,
  logger: Logger,
): void {
  logger.info(`Summary of SML objects created`);
  Object.keys(smlResult).forEach((smlObjectType) => {
    const value = smlResult[smlObjectType as keyof SmlConverterResult];
    if (Array.isArray(value)) {
      logger.info(`${smlObjectType}: ${value.length}`);
    }
  });
}

export class SmlConvertResultBuilder {
  private _connections: Array<SMLConnection> = [];
  private _models: Array<SMLModel> = [];
  private _datasets: Array<SMLDataset> = [];
  private _dimensions: Array<SMLNormalDimension> = [];
  private _measures: Array<SMLMetric> = [];
  private _measuresCalculated: Array<SMLMetricCalculated> = [];
  private _compositeModels: Array<SMLCompositeModel> = [];
  private _rowSecurity: Array<SMLRowSecurity> = [];
  private _catalog?: SMLCatalog = undefined;

  public get catalog(): SMLCatalog {
    return Guard.ensure(this._catalog, "catalog is not set");
  }

  public set catalog(value: SMLCatalog) {
    Guard.should(this._catalog === undefined, `catalog is already set!`);
    this._catalog = value;
  }

  private allObjects(): Array<SMLObject> {
    const result: Array<SMLObject> = [
      ...this._connections,
      ...this._datasets,
      ...this._dimensions,
      ...this._dimensions,
      ...this._measures,
      ...this._measuresCalculated,
      ...this._compositeModels,
      ...this._rowSecurity,
      ...this._models,
    ];

    if (this._catalog) {
      result.push(this._catalog);
    }

    return result;
  }

  private addObjectToArray<T extends SMLObject>(array: Array<T>, item: T) {
    //ensure unique_name is unique

    const otherObject = this.allObjects().find(
      (o) =>
        o.unique_name === item.unique_name &&
        o.object_type === item.object_type,
    );

    if (otherObject) {
      throw new Error(
        `Cannot add "${item.object_type}" with unique_name: "${item.unique_name}". There is already a "${otherObject.object_type}" with same unique_name`,
      );
    }

    array.push(item);
  }

  addConnection(connection: SMLConnection) {
    this.addObjectToArray(this._connections, connection);
  }

  addModel(model: SMLModel) {
    this.addObjectToArray(this._models, model);
  }

  addDatasets(dataset: SMLDataset) {
    this.addObjectToArray(this._datasets, dataset);
  }

  addDimension(dimension: SMLDimension) {
    this.addObjectToArray(this._dimensions, dimension);
  }

  addMeasures(measure: SMLMetric) {
    this.addObjectToArray(this._measures, measure);
  }

  addMeasuresCalc(measureCalc: SMLMetricCalculated) {
    this.addObjectToArray(this._measuresCalculated, measureCalc);
  }
  addCompositeModel(compModel: SMLCompositeModel) {
    this.addObjectToArray(this._compositeModels, compModel);
  }

  addRowSecurity(rowSecurity: SMLRowSecurity) {
    this.addObjectToArray(this._rowSecurity, rowSecurity);
  }

  getResult(): SmlConverterResult {
    return {
      connections: this._connections,
      datasets: this._datasets,
      dimensions: this._dimensions,
      measures: this._measures,
      measuresCalculated: this._measuresCalculated,
      models: this._models,
      compositeModels: this._compositeModels,
      rowSecurity: this._rowSecurity,
      catalog: this.catalog,
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

  public get compositeModels() {
    return this._compositeModels;
  }

  public get rowSecurity() {
    return this._rowSecurity;
  }
}
