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
 * @version 1.1.0
 * @license Apache License Version 2.0 http://www.apache.org/licenses/LICENSE-2.0.txt
 *
 * Thanks to Twitter for Snowflake.
 */

'use strict';

(function() {
    var undefined;

    var _version = '1.1.0';
    var _author = 'Silviu Schiau';

    var _self = typeof self == 'object' && self && self.Object === Object && self;
    var _root = _self || Function('return this')();

    // Generate random Int in interval
    function generateRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min)) + min
    }

    function validate(_machineId, _epoch) {
        if (isNaN(_machineId)) {
            throw new Error("Machine ID should be digits only and not undefined");
        } else {
            if (_machineId < 1 || _machineId > 512 ) {
                throw new Error("Enter a valid machine id range [1-512]");
            }
        }

        if (isNaN(_epoch)) {
            throw new Error("Epoch should be digits only and not undefined");
        } else {
            if (_epoch.toString().length < 13) {
                throw new Error("UNIX time should be in miliseconds (min 13 digits)");
            }
        }
    }

    var Particle = {
        version: _version,
        author: _author,
        machineId: undefined,
        epoch: undefined,
        generateParticle: function() {
            var _epoch = this.epoch;
            var _machineId = this.machineId;

            validate(_machineId, _epoch);

            // Time - 41 bits
            var time = Math.floor(new Date());

            // Substract custom epoch from current time
            time -= _epoch;

            // Create a base and add time to it
            var base = (Math.pow(2, 40) - 1 + time).toString(2);

            // Configured machine id - 10 bits - up to 512 machines
            var machineId = (Math.pow(2, 9) - 1 + _machineId).toString(2);

            // Sequence number - 12 bits - up to 2048 random numbers per machine
            var random = generateRandomInt(1, (Math.pow(2, 11) - 1))
            random = (Math.pow(2, 11) - 1 + random).toString(2);

            // Pack
            var base = base + machineId + random;

            // Return
            var returnParticle = parseInt(base, 2);

            // Return unique time id no
            return returnParticle;
        },
        timeFromParticle: function(particle) {
            return parseInt(particle.toString(2).substring(0, 41), 2) - Math.pow(2, 40) - 1 + this.epoch;
        }
    }

    // Export to the global object.
    _root.Particle = Particle;
}.call(this));