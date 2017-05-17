/**
 * Copyright 2014-2016 Silviu Schiau.
 *
 * This copyright notice
 * shall be included in all copies or substantial portions of the software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 *
 * @about JavaScript implementation of Twitter Snowflake ID Generator (64 bit ID)
 * @author Silviu Schiau <pr@silviu.co>
 * @version 2.2.0
 * @license Apache License Version 2.0 http://www.apache.org/licenses/LICENSE-2.0.txt
 *
 * Thanks to Twitter for Snowflake.
 */

'use strict';

(function () {
  var _version = '2.2.1'
  var _author = 'Silviu Schiau'

  var _self = typeof self === 'object' && self && self.Object === Object && self
  var _root = _self || Function('return this')()

  // Generate random Int in interval
  function generateRandomInt (min, max) {
    return Math.floor(Math.random() * (max - min)) + min
  }

  function validate (_machineId, _epoch) {
    if (isNaN(_machineId)) {
      throw new Error('Machine ID should be digits only and not undefined')
    } else {
      if (_machineId < 0 || _machineId > 1023) {
        throw new Error('Enter a valid machine id range [0-1023]')
      }
    }

    if (isNaN(_epoch)) {
      throw new Error('Epoch should be digits only and not undefined')
    } else {
      if (_epoch.toString().length < 13) {
        throw new Error('UNIX time should be in miliseconds (min 13 digits)')
      }
    }
  }

  String.prototype.lpad = function (padString, length) {
    var str = this

    while (str.length < length) {
      str = padString + str
    }

    return str
  }

  var max12bit = 4095
  var max41bit = 1099511627775

  var Particle = {
    version: _version,
    author: _author,
    machineId: void 0,
    epoch: void 0,
    generateParticle: function () {
      var _epoch = this.epoch
      var _machineId = this.machineId

      validate(_machineId, _epoch)

      // Time - 42 bits
      var time = Math.floor(new Date())

      // Substract custom epoch from current time
      time -= _epoch

      // Create a base and add time to it
      var base = (max41bit + time).toString(2)

      // Configured machine id - 10 bits - up to 1024 machines
      var machineId = _machineId.toString(2).lpad('0', 10)

      // Sequence number - 12 bits - up to 4096 random numbers per machine
      var random = generateRandomInt(0, max12bit).toString(2).lpad('0', 12)

      // Pack
      base += machineId + random

      // Return
      var returnParticle = parseInt(base, 2)

      // Return unique time id no
      return returnParticle
    },
    timeFromParticle: function (particle) {
      return parseInt(particle.toString(2).substring(0, 41), 2) - max41bit + this.epoch
    }
  }

  // Export to the global object.
  _root.Particle = Particle
}.call(this))
