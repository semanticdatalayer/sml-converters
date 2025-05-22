"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Guard = exports.getRequiredValueErrorMessage = void 0;
const getRequiredValueErrorMessage = (valueName) => `${valueName} is required`;
exports.getRequiredValueErrorMessage = getRequiredValueErrorMessage;
class GuardImplementation {
    constructor(ErrorConstructor) {
        this.ErrorConstructor = ErrorConstructor;
    }
    forError(ErrorConstructor) {
        return new GuardImplementation(ErrorConstructor);
    }
    should(rule, msg) {
        if (!rule) {
            throw new this.ErrorConstructor(msg);
        }
    }
    exists(object, msg) {
        this.should(object !== null && object !== undefined, msg);
        if (typeof object === "number") {
            this.should(!isNaN(object), msg);
        }
    }
    notEmpty(value, msg) {
        const notEmpty = value !== null && value !== undefined && value.trim() !== "";
        this.should(notEmpty, msg);
    }
    allRequired(values) {
        values.forEach(([value, valueName]) => {
            const msg = (0, exports.getRequiredValueErrorMessage)(valueName);
            if (typeof value === "string") {
                this.notEmpty(value, msg);
            }
            this.exists(value, msg);
        });
    }
    ensure(object, msg) {
        this.exists(object, msg);
        if (!object) {
            throw new this.ErrorConstructor(msg);
        }
        return object;
    }
    ensureType(object, typeGuard, msg) {
        if (typeGuard(object)) {
            return object;
        }
        else {
            throw new this.ErrorConstructor(msg);
        }
    }
}
exports.Guard = new GuardImplementation(Error);
exports.default = exports.Guard;
