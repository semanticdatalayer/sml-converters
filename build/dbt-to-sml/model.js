"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DbtFileType = exports.ConversionError = void 0;
class ConversionError extends Error {
    constructor(message) {
        super(message);
    }
}
exports.ConversionError = ConversionError;
var DbtFileType;
(function (DbtFileType) {
    DbtFileType["project"] = "project";
    DbtFileType["package"] = "package";
    DbtFileType["selectors"] = "selectors";
    DbtFileType["property"] = "property";
})(DbtFileType || (exports.DbtFileType = DbtFileType = {}));
