[![Build Status](https://travis-ci.org/sschiau/Particle.js.svg?branch=master)](https://travis-ci.org/sschiau/Particle.js)
[![codecov.io](https://codecov.io/gh/sschiau/Particle.js/coverage.svg?branch=master)](https://codecov.io/gh/sschiau/Particle.js?branch=master)
[![Known Vulnerabilities](https://snyk.io/test/github/sschiau/Particle.js/badge.svg?targetFile=package.json)](https://snyk.io/test/github/sschiau/Particle.js?targetFile=package.json)

[![NPM](https://nodei.co/npm/Particle.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/Particle/)

# Particle
#### Language: JavaScript
#### 64bits int Time Based ID Generator
JavaScript implementation of Twitter Snowflake ID Generator

### Uncoordinated
For high availability within and across data centers, machines generating ids should not have to coordinate with each other.

### Solution
* id (64 bits) is composed of:
  * time - 42 bits (millisecond precision w/ a custom epoch)
  * configured machine id - 10 bits - up to 1024 machines
  * sequence number - 12 bits - up to 4096 random numbers

### System Clock Dependency
You should use NTP to keep your system clock accurate.

## How to use it
Check [Demo](https://github.com/sschiau/Particle.js/blob/master/Demo/index.html)
