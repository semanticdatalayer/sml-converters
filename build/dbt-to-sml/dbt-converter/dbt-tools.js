"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DbtTools = void 0;
const sdk_1 = require("sdk");
class DbtTools {
    static noPreOrSuffix(baseName) {
        if (baseName.endsWith("_dataset"))
            baseName = baseName.substring(0, baseName.lastIndexOf("_dataset"));
        if (baseName.startsWith("Dim_"))
            baseName = baseName.substring(4);
        return baseName;
    }
    static dimName(baseName) {
        if (baseName.endsWith("_dataset"))
            baseName = baseName.substring(0, baseName.lastIndexOf("_dataset"));
        if (baseName.startsWith("Dim_"))
            return baseName;
        return `Dim_${baseName}`;
    }
    static dimLabel(baseName) {
        if (baseName.startsWith("Dim "))
            return baseName;
        return `Dim ${baseName}`;
    }
    static dsName(baseName) {
        if (baseName.endsWith("_dataset"))
            return baseName;
        return `${baseName}_dataset`;
    }
    static isCalculated(smlMetric) {
        if (smlMetric === null)
            return false;
        if ("expression" in smlMetric)
            return true;
        return false;
    }
    static refOnly(input) {
        if (input && input.includes("ref(") && input.includes(")")) {
            input = input.replace(/ref\(/g, "");
            input = input.replace(/'/g, "");
            input = input.substring(0, input.lastIndexOf(")"));
        }
        return input;
    }
    static exists(object) {
        if (object === null || object === undefined || !object)
            return false;
        return true;
    }
    static hasStringValue(val) {
        if (val && this.isString(val) && val.length > 0)
            return typeof val === "string";
        return false;
    }
    static isString(x) {
        return typeof x === "string" && x !== null;
    }
    static makeStringValue(val) {
        if (!val)
            return "";
        if (typeof val === "string")
            return val;
        if (typeof val === "number")
            return val.toString();
        return "";
    }
    static isNumber(val) {
        if (!val)
            return false;
        return typeof val === "number";
    }
    static isInt(value) {
        if (parseInt(value, 10).toString() === value) {
            return true;
        }
        return false;
    }
    static initCap(val) {
        return DbtTools.makeStringValue(val.charAt(0).toUpperCase() + val.slice(1));
    }
    static makeUniqueName(name) {
        const result = name.replace(/[ #.()&?%-+/]/g, "_").toLowerCase();
        return result;
    }
    static makeLower(name) {
        return name.toLowerCase();
    }
    static mapAggregation(agg, measName, logger) {
        if (agg && agg != "") {
            switch (agg // DbtTools.makeStringValue(agg.toLocaleLowerCase)) {
            ) {
                case "sum":
                    return sdk_1.SMLCalculationMethod.Sum;
                case "min":
                    return sdk_1.SMLCalculationMethod.Minimum;
                case "max":
                    return sdk_1.SMLCalculationMethod.Maximum;
                case "average":
                    return sdk_1.SMLCalculationMethod.Average;
                case "count_distinct":
                    return sdk_1.SMLCalculationMethod.CountDistinct;
                case "sum_distinct":
                    return sdk_1.SMLCalculationMethod.SumDistinct;
                case "sum_boolean":
                    return sdk_1.SMLCalculationMethod.Sum; // TODO: Do we need a calculated column for this?
                case "count":
                    return sdk_1.SMLCalculationMethod.NonDistinctCount;
                case "percentile":
                    return sdk_1.SMLCalculationMethod.Percentile;
                case "median":
                    logger.warn("Measure '" +
                        measName +
                        "' will be defined with aggregation 'average' because 'median' is not currently supported");
                    return sdk_1.SMLCalculationMethod.Average;
            }
        }
        logger.warn(`Measure '${measName}' will be defined with aggregation 'sum' because '${agg}' is an unknown or unsupported aggregation type`);
        return sdk_1.SMLCalculationMethod.Sum;
    }
    static typeParamsToObject(typeIn) {
        // object is SMLMetric {
        if (DbtTools.isString(typeIn)) {
            const newVal = { name: typeIn };
            return newVal;
        }
        return typeIn;
    }
    static toObjectFromStringOrObject(typeIn) {
        if (DbtTools.isString(typeIn)) {
            const newVal = { name: typeIn };
            return newVal;
        }
        if (typeIn)
            return typeIn;
        return typeIn;
    }
    static isUniquelyNamedObject(valIn) {
        if (valIn && "unique_name" in valIn /* && valIn.unique_name.length > 0 */)
            return true;
        return false;
    }
    static escapeRegExp(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
    }
    static replaceAll(str, find, replace) {
        return str.replace(new RegExp(DbtTools.escapeRegExp(find), "g"), replace);
    }
}
exports.DbtTools = DbtTools;
