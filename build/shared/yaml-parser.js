"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseYaml = void 0;
const js_yaml_1 = require("js-yaml");
const parseYaml = (input) => {
    return (0, js_yaml_1.load)(input, {
        schema: js_yaml_1.JSON_SCHEMA,
    });
};
exports.parseYaml = parseYaml;
