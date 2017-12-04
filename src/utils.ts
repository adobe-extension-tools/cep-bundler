import { readFileSync, writeFileSync, symlinkSync } from 'fs'
import { execSync } from 'child_process'
import * as rimraf from 'rimraf'
import * as mkdirplib from 'mkdirp'
import * as ncp from 'ncp'

export function copyAndReplace(from: string, to: string, replace: object) {
  let contents = readFileSync(from, 'utf8')
  Object.keys(replace).forEach(key => {
    contents = contents.replace(new RegExp(`${key}`, 'g'), replace[key])
  })
  writeFileSync(to, contents)
}

export function rmrf(path: string) {
  rimraf.sync(path)
}

export function mkdirp(path: string) {
  mkdirplib.sync(path)
}

export function cp(from: string, to: string) {
  writeFileSync(to, readFileSync(from, 'utf8'))
}

export function cpr(from: string, to: string): Promise<void> {
  execSync(`cp -r "${from}" "${to}"`)
  return Promise.resolve()
}

export function symlinkDir(from: string, to: string) {
  symlinkSync(to, from, 'dir')
}