/**
 * Copyright 2014 Silviu Schiau.
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
 * @package Schiau
 * @created 1393394887 (UNIX Time)
 * @modified 1418950507 (UNIX Time)
 * @version 1.0.1
 * @license Apache License Version 2.0 http://www.apache.org/licenses/LICENSE-2.0.txt
 *
 * Thanks to Twitter for Snowflake.
 */

function Particle()
{
    const epoch = 1418951572546;
    
    this.generateParticle = function(machine_id)
    {
		/* 
		* Time - 41 bits
		*/
        time = Math.floor(new Date());

		/*
		* Substract custom epoch from current time
		*/
        time -= epoch;
        
		/*
		* Create a base and add time to it
		*/
		base = (Math.pow(2,40) - 1 + time).toString(2);
		
		/*
		* Configured machine id - 10 bits - up to 512 machines
		*/
		machine_id = (Math.pow(2,9) - 1 + machine_id).toString(2);
		
		/*
		* sequence number - 12 bits - up to 2048 random numbers per machine
		*/
		random = generateRandomInt(1, (Math.pow(2,11) - 1))
		random = (Math.pow(2,11) - 1 + random).toString(2);

		/*
		* Pack
		*/
		base = base + machine_id + random;
		
		/*
		* Return unique time id no
		*/
		return parseInt(base, 2);
    }
	
	
    this.timeFromParticle = function(particle)
    {
		/*
		* Return time
		*/
		return parseInt(particle.toString(2).substring(0,41), 2) - Math.pow(2,40) - 1 + epoch;
    }
	
	/*
	* Generate random Int in interval
	*/
	function generateRandomInt(min, max) 
	{
	  return Math.floor(Math.random() * (max - min)) + min;
	}
	
}