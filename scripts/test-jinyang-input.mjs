#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const stage=mkdtempSync(resolve(tmpdir(),"shi-jinyang-input-"));
try {
  const binary=resolve(stage,"jinyang-input");
  const compile=spawnSync(process.env.CXX || "c++",[
    "-std=c++17","-Wall","-Wextra","-Werror","-O1",
    resolve(root,"scripts/test-jinyang-input.cpp"),"-o",binary,
  ],{stdio:"inherit",timeout:60000});
  if(compile.error)throw compile.error;
  if(compile.status!==0)throw Error("Native input compilation failed");
  const result=spawnSync(binary,[],{stdio:"inherit",timeout:10000});
  if(result.error)throw result.error;
  if(result.status!==0)throw Error("Native input assertions failed");
} finally {
  // Only this process's generated temporary binary directory.
  rmSync(stage,{recursive:true,force:true});
}
