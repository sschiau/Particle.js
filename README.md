[![Build Status](https://travis-ci.org/sschiau/Particle.js.svg?branch=master)](https://travis-ci.org/sschiau/Particle.js)

#Particle
####Language: JavaScript
####64bits int Time Based ID Generator
JavaScript implementation of Twitter Snowflake ID Generator

[![NPM](https://nodei.co/npm/Particle.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/Particle/)

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
